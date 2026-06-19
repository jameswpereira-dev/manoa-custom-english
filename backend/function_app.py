import azure.functions as func
import json, os, base64, io, re, uuid, logging
from datetime import datetime, timedelta
import requests
import anthropic
import stripe
from azure.cosmos import CosmosClient, PartitionKey, exceptions as cosmos_exc
from azure.storage.blob import BlobServiceClient

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# ── Clients ──────────────────────────────────────────────────────────────────

def get_cosmos_container():
    client = CosmosClient.from_connection_string(os.environ["COSMOS_CONNECTION_STRING"])
    db = client.create_database_if_not_exists("manoa")
    return db.create_container_if_not_exists(
        id="words",
        partition_key=PartitionKey(path="/aluno_id"),
    )

def get_users_container():
    client = CosmosClient.from_connection_string(os.environ["COSMOS_CONNECTION_STRING"])
    db = client.create_database_if_not_exists("manoa")
    return db.create_container_if_not_exists(
        id="users",
        partition_key=PartitionKey(path="/aluno_id"),
    )


def get_blob_container():
    svc = BlobServiceClient.from_connection_string(os.environ["STORAGE_CONNECTION_STRING"])
    container = svc.get_container_client("audios")
    try:
        container.create_container(public_access="blob")
    except Exception:
        pass
    return container

# ── Firebase token verification ───────────────────────────────────────────────

def verify_firebase_token(req: func.HttpRequest):
    """
    Verifies the Firebase ID token from the Authorization header.
    Returns the uid or raises ValueError.
    """
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise ValueError("Missing Authorization header")
    id_token = auth_header[7:]

    project_id = os.environ.get("FIREBASE_PROJECT_ID", "")
    url = (
        f"https://identitytoolkit.googleapis.com/v1/accounts:lookup"
        f"?key={os.environ.get('FIREBASE_WEB_API_KEY','')}"
    )
    resp = requests.post(url, json={"idToken": id_token}, timeout=10)
    if resp.status_code != 200:
        raise ValueError("Invalid Firebase token")
    users = resp.json().get("users", [])
    if not users:
        raise ValueError("User not found")
    return users[0]["localId"]


ALLOWED_ORIGINS = {
    "https://manoacustomenglish.com",
    "https://www.manoacustomenglish.com",
    "https://purple-smoke-0a58d0f0f.7.azurestaticapps.net",
    "http://localhost:3000",
    "http://localhost:3001",
}


def cors_headers(req: func.HttpRequest = None):
    # Reflect the exact requesting origin when it's in the allow-list.
    # Must NOT use "*" when the request carries an Authorization header —
    # browsers require an explicit origin + Allow-Credentials: true in that case.
    origin = (req.headers.get("Origin", "") if req else "") or \
             "https://purple-smoke-0a58d0f0f.7.azurestaticapps.net"
    allowed = origin if origin in ALLOWED_ORIGINS else \
              "https://purple-smoke-0a58d0f0f.7.azurestaticapps.net"
    return {
        "Access-Control-Allow-Origin":      allowed,
        "Access-Control-Allow-Methods":     "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":     "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Vary":                             "Origin",
    }


def options_response(req: func.HttpRequest = None):
    return func.HttpResponse("", status_code=200, headers=cors_headers(req))


# ── Text extraction ───────────────────────────────────────────────────────────

def extract_text_from_pdf(b64_data: str) -> str:
    import PyPDF2
    pdf_bytes = base64.b64decode(b64_data)
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    return "\n".join(p.extract_text() or "" for p in reader.pages)


def extract_text_from_docx(b64_data: str) -> str:
    from docx import Document
    doc_bytes = base64.b64decode(b64_data)
    doc = Document(io.BytesIO(doc_bytes))
    return "\n".join(p.text for p in doc.paragraphs)


def extract_vocabulary_from_text(text: str, context: str) -> list:
    """Use Claude to pull relevant English vocabulary from a long text."""
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    prompt = f"""You are an English vocabulary expert. Extract the most relevant and useful English vocabulary words from the following text.
Context: {context or 'general professional use'}

Rules:
- Return only English words/phrases (not Portuguese)
- Focus on domain-specific, advanced, or useful vocabulary
- Exclude very common words (the, a, is, are, etc.)
- Return 10-25 most relevant words
- Return as a JSON array of strings: ["word1", "word2", ...]

Text:
{text[:4000]}

Return ONLY the JSON array, nothing else."""

    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return []


# ── Claude enrichment ─────────────────────────────────────────────────────────

def enrich_word(word: str, context: str) -> dict:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    ctx = context or 'general professional English'

    prompt = f"""You are an English teacher creating personalized learning content.

Word: {word}
Context: {ctx}

Generate learning content for a Brazilian Portuguese speaker. Return ONLY valid JSON with exactly this structure:
{{
  "definicao_pt": "Clear definition in Portuguese (2-3 sentences)",
  "exemplo_uso": "One natural example sentence using this word in the given context",
  "exercicios": [
    {{
      "type": "fill_in_the_blank",
      "question": "Fill in the blank: '[natural sentence using ___ where {word} belongs]'",
      "answer": "{word}"
    }},
    {{
      "type": "multiple_choice",
      "question": "What does '{word}' mean in the context of {ctx}?",
      "options": ["[correct definition]", "[plausible wrong 1]", "[plausible wrong 2]", "[plausible wrong 3]"],
      "answer": "[correct definition]"
    }},
    {{
      "type": "true_or_false",
      "question": "[A statement about the meaning or usage of '{word}' that is either clearly true or clearly false]",
      "answer": "true"
    }},
    {{
      "type": "sentence_building",
      "question": "Write an original sentence using the word '{word}' in the context of {ctx}.",
      "answer": "[A realistic example sentence using {word}]"
    }},
    {{
      "type": "definition_match",
      "question": "Which short phrase best defines '{word}'?",
      "options": ["[correct short definition]", "[wrong definition 1]", "[wrong definition 2]", "[wrong definition 3]"],
      "answer": "[correct short definition]"
    }}
  ]
}}

Rules:
- Replace ALL bracketed placeholders with real, specific content
- fill_in_the_blank answer must always be exactly: {word}
- true_or_false answer must be exactly 'true' or 'false' (lowercase)
- Both options arrays must have exactly 4 distinct items
- sentence_building answer must be a full, grammatically correct sentence
- Return ONLY the JSON object, no other text"""

    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError(f"Could not parse Claude response for word: {word}")


# ── ElevenLabs TTS ────────────────────────────────────────────────────────────

def generate_audio(word: str) -> bytes:
    voice_id = "nPczCjzI2devNBz1zQrb"  # Brian
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": os.environ["ELEVENLABS_API_KEY"],
        "Content-Type": "application/json",
    }
    payload = {
        "text": word,
        "model_id": "eleven_turbo_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.content


def upload_audio(word: str, aluno_id: str, audio_bytes: bytes) -> str:
    container = get_blob_container()
    blob_name = f"{aluno_id}/{word.lower().replace(' ', '_')}_{uuid.uuid4().hex[:8]}.mp3"
    container.upload_blob(blob_name, audio_bytes, overwrite=True)
    account_name = os.environ.get("STORAGE_ACCOUNT_NAME", "stmanoacustomenglish")
    return f"https://{account_name}.blob.core.windows.net/audios/{blob_name}"


# ── HTTP Functions ────────────────────────────────────────────────────────────

@app.route(route="process-content", methods=["POST", "OPTIONS"])
def process_content(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return options_response(req)

    try:
        uid = verify_firebase_token(req)
    except ValueError as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=401,
                                 mimetype="application/json", headers=cors_headers(req))

    try:
        body = req.get_json()
        mode    = body.get("mode", "A")
        context = body.get("context", "")

        # ── Check subscription ────────────────────────────────────────────
        users_container = get_users_container()
        user_doc        = None
        palavras_disponiveis = 0
        try:
            user_doc = users_container.read_item(item=uid, partition_key=uid)
            if user_doc.get("status") != "ativo":
                return func.HttpResponse(
                    json.dumps({"error": "Plano não ativo.", "code": "NO_PLAN"}),
                    status_code=402, mimetype="application/json", headers=cors_headers(req)
                )
            palavras_disponiveis = user_doc.get("palavras_disponiveis", 0)
            if palavras_disponiveis <= 0:
                return func.HttpResponse(
                    json.dumps({"error": "Você atingiu o limite do seu plano. Faça upgrade para continuar.", "code": "LIMIT_REACHED"}),
                    status_code=402, mimetype="application/json", headers=cors_headers(req)
                )
        except cosmos_exc.CosmosResourceNotFoundError:
            return func.HttpResponse(
                json.dumps({"error": "Nenhuma assinatura ativa encontrada.", "code": "NO_PLAN"}),
                status_code=402, mimetype="application/json", headers=cors_headers(req)
            )

        # ── Resolve word list ─────────────────────────────────────────────
        if mode in ("A", "B"):
            words = [w.strip() for w in body.get("words", []) if w.strip()]
        else:
            file_b64  = body.get("file_b64", "")
            file_name = body.get("file_name", "")
            if file_name.lower().endswith(".pdf"):
                text = extract_text_from_pdf(file_b64)
            else:
                text = extract_text_from_docx(file_b64)
            words = extract_vocabulary_from_text(text, context)

        if not words:
            return func.HttpResponse(json.dumps({"error": "No words found"}),
                                     status_code=400, mimetype="application/json",
                                     headers=cors_headers(req))

        # Cap to available words
        words = words[:min(len(words), palavras_disponiveis, 30)]

        container = get_cosmos_container()
        saved = []

        for word in words:
            try:
                enriched    = enrich_word(word, context)
                audio_bytes = generate_audio(word)
                audio_url   = upload_audio(word, uid, audio_bytes)

                doc_id = f"{uid}_{word.lower().replace(' ','_')}"
                document = {
                    "id":           doc_id,
                    "aluno_id":     uid,
                    "palavra":      word,
                    "contexto":     context,
                    "definicao_pt": enriched.get("definicao_pt", ""),
                    "exemplo_uso":  enriched.get("exemplo_uso", ""),
                    "exercicios":   enriched.get("exercicios", []),
                    "audio_url":    audio_url,
                    "progresso":    {"acertos": 0, "tentativas": 0},
                }
                container.upsert_item(document)
                saved.append(word)
                logging.info(f"[process-content] saved: {word} for {uid}")
            except Exception as e:
                logging.error(f"[process-content] failed for '{word}': {e}")

        # Decrement palavras_disponiveis
        if user_doc and saved:
            user_doc["palavras_disponiveis"] = max(0, palavras_disponiveis - len(saved))
            users_container.upsert_item(user_doc)

        return func.HttpResponse(
            json.dumps({"saved": saved, "total": len(saved)}),
            status_code=200, mimetype="application/json", headers=cors_headers(req)
        )

    except Exception as e:
        logging.error(f"[process-content] error: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}),
                                 status_code=500, mimetype="application/json",
                                 headers=cors_headers(req))


@app.route(route="get-words", methods=["GET", "OPTIONS"])
def get_words(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return options_response(req)

    try:
        uid = verify_firebase_token(req)
    except ValueError as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=401,
                                 mimetype="application/json", headers=cors_headers(req))

    try:
        container = get_cosmos_container()
        items = list(container.query_items(
            query="SELECT * FROM c WHERE c.aluno_id = @uid ORDER BY c._ts DESC",
            parameters=[{"name": "@uid", "value": uid}],
            enable_cross_partition_query=False,
        ))
        return func.HttpResponse(
            json.dumps({"words": items}),
            status_code=200, mimetype="application/json", headers=cors_headers(req)
        )
    except Exception as e:
        logging.error(f"[get-words] error: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}),
                                 status_code=500, mimetype="application/json",
                                 headers=cors_headers(req))


@app.route(route="update-progress", methods=["POST", "OPTIONS"])
def update_progress(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return options_response(req)

    try:
        uid = verify_firebase_token(req)
    except ValueError as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=401,
                                 mimetype="application/json", headers=cors_headers(req))

    try:
        body    = req.get_json()
        word_id = body["word_id"]
        correct = bool(body.get("correct", False))

        container = get_cosmos_container()
        item = container.read_item(item=word_id, partition_key=uid)
        prog = item.get("progresso", {"acertos": 0, "tentativas": 0})
        prog["tentativas"] += 1
        if correct:
            prog["acertos"] += 1
        item["progresso"] = prog
        container.upsert_item(item)
        return func.HttpResponse(json.dumps({"ok": True}),
                                 status_code=200, mimetype="application/json",
                                 headers=cors_headers(req))
    except Exception as e:
        logging.error(f"[update-progress] error: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}),
                                 status_code=500, mimetype="application/json",
                                 headers=cors_headers(req))


@app.route(route="delete-word/{word_id}", methods=["DELETE", "OPTIONS"])
def delete_word(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return options_response(req)

    try:
        uid = verify_firebase_token(req)
    except ValueError as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=401,
                                 mimetype="application/json", headers=cors_headers(req))

    try:
        word_id   = req.route_params.get("word_id")
        container = get_cosmos_container()
        container.delete_item(item=word_id, partition_key=uid)
        return func.HttpResponse(json.dumps({"ok": True}),
                                 status_code=200, mimetype="application/json",
                                 headers=cors_headers(req))
    except cosmos_exc.CosmosResourceNotFoundError:
        return func.HttpResponse(json.dumps({"error": "Not found"}),
                                 status_code=404, mimetype="application/json",
                                 headers=cors_headers(req))
    except Exception as e:
        logging.error(f"[delete-word] error: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}),
                                 status_code=500, mimetype="application/json",
                                 headers=cors_headers(req))


@app.route(route="generate-words", methods=["POST", "OPTIONS"])
def generate_words_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return options_response(req)

    try:
        uid = verify_firebase_token(req)
    except ValueError as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=401,
                                 mimetype="application/json", headers=cors_headers(req))

    try:
        body       = req.get_json()
        profession = body.get("profession", "").strip()
        quantity   = int(body.get("quantity", 10))

        if not profession:
            return func.HttpResponse(json.dumps({"error": "Profissão não informada"}),
                                     status_code=400, mimetype="application/json",
                                     headers=cors_headers(req))

        quantity = min(max(quantity, 5), 20)

        client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        prompt = f"""You are an English language specialist helping Brazilian professionals learn English.

Generate {quantity} highly useful English vocabulary items for someone working in the field of: {profession}

IMPORTANT RULES:
- Prioritize multi-word expressions, phrasal verbs, idioms, and ready-made phrases OVER isolated single words
- Focus on items that are commonly used in professional {profession} contexts
- Include a mix of: phrasal verbs (e.g. "roll back"), fixed expressions (e.g. "raise a ticket"), professional idioms (e.g. "touch base"), and key domain terms
- Avoid very basic vocabulary (the, work, make, do, etc.)

Return ONLY a valid JSON array with exactly {quantity} items in this format:
[
  {{
    "term": "the English word, expression, or phrase",
    "type": "word|expression|phrasal_verb",
    "preview": "breve explicação em português: o que significa e quando usar"
  }}
]

Return ONLY the JSON array, nothing else."""

        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw   = msg.content[0].text.strip()
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        items = json.loads(match.group()) if match else []

        return func.HttpResponse(
            json.dumps({"items": items, "profession": profession}),
            status_code=200, mimetype="application/json", headers=cors_headers(req)
        )

    except Exception as e:
        logging.error(f"[generate-words] error: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}),
                                 status_code=500, mimetype="application/json",
                                 headers=cors_headers(req))


# ── Subscription endpoints ────────────────────────────────────────────────────

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://manoacustomenglish.com")

PLAN_PRICE_IDS = lambda: {
    "20": os.environ.get("STRIPE_PRICE_ID_20", ""),
    "30": os.environ.get("STRIPE_PRICE_ID_30", ""),
    "40": os.environ.get("STRIPE_PRICE_ID_40", ""),
}


@app.route(route="get-subscription", methods=["GET", "OPTIONS"])
def get_subscription(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return options_response(req)

    try:
        uid = verify_firebase_token(req)
    except ValueError as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=401,
                                 mimetype="application/json", headers=cors_headers(req))
    try:
        users_container = get_users_container()
        try:
            doc = users_container.read_item(item=uid, partition_key=uid)
            return func.HttpResponse(
                json.dumps({
                    "plano":               doc.get("plano"),
                    "status":              doc.get("status"),
                    "palavras_disponiveis": doc.get("palavras_disponiveis", 0),
                    "renovacao":           doc.get("renovacao"),
                    "stripe_customer_id":  doc.get("stripe_customer_id"),
                }),
                status_code=200, mimetype="application/json", headers=cors_headers(req)
            )
        except cosmos_exc.CosmosResourceNotFoundError:
            return func.HttpResponse(
                json.dumps({"status": "sem_plano"}),
                status_code=200, mimetype="application/json", headers=cors_headers(req)
            )
    except Exception as e:
        logging.error(f"[get-subscription] error: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}),
                                 status_code=500, mimetype="application/json",
                                 headers=cors_headers(req))


@app.route(route="create-checkout-session", methods=["POST", "OPTIONS"])
def create_checkout_session(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return options_response(req)

    try:
        uid = verify_firebase_token(req)
    except ValueError as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=401,
                                 mimetype="application/json", headers=cors_headers(req))

    try:
        body  = req.get_json()
        plan  = str(body.get("plan", ""))
        price_id = PLAN_PRICE_IDS().get(plan)

        if not price_id:
            return func.HttpResponse(
                json.dumps({"error": f"Plano '{plan}' inválido ou preço não configurado."}),
                status_code=400, mimetype="application/json", headers=cors_headers(req)
            )

        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

        session = stripe.checkout.Session.create(
            payment_method_types=["card", "boleto"],
            payment_method_options={
                "boleto": {
                    "expires_after_days": 3,
                },
            },
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url="https://manoacustomenglish.com/sucesso?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://manoacustomenglish.com/?planos=1",
            client_reference_id=uid,
            metadata={"uid": uid, "plano": plan},
            subscription_data={"metadata": {"uid": uid, "plano": plan}},
        )

        return func.HttpResponse(
            json.dumps({"url": session.url}),
            status_code=200, mimetype="application/json", headers=cors_headers(req)
        )
    except Exception as e:
        logging.error(f"[create-checkout-session] error: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}),
                                 status_code=500, mimetype="application/json",
                                 headers=cors_headers(req))


@app.route(route="stripe-webhook", methods=["POST"])
def stripe_webhook(req: func.HttpRequest) -> func.HttpResponse:
    payload    = req.get_body()
    sig_header = req.headers.get("Stripe-Signature", "")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception as e:
        logging.error(f"[stripe-webhook] signature error: {e}")
        return func.HttpResponse(json.dumps({"error": "Invalid signature"}), status_code=400,
                                 mimetype="application/json")

    users_container = get_users_container()

    try:
        if event["type"] == "checkout.session.completed":
            session  = event["data"]["object"]
            uid      = getattr(session, "client_reference_id", None)
            metadata = getattr(session, "metadata", {}) or {}
            plano    = int(getattr(metadata, "plano", 0) or 0)
            cus_id   = getattr(session, "customer", None)
            sub_id   = getattr(session, "subscription", None)

            if uid and plano:
                renovacao = (datetime.utcnow() + timedelta(days=30)).isoformat()
                users_container.upsert_item({
                    "id":                   uid,
                    "aluno_id":             uid,
                    "plano":                plano,
                    "status":               "ativo",
                    "palavras_disponiveis": plano,
                    "renovacao":            renovacao,
                    "stripe_customer_id":   cus_id,
                    "stripe_subscription_id": sub_id,
                })
                logging.info(f"[stripe-webhook] subscription created for {uid}, plano={plano}")

        elif event["type"] == "invoice.payment_succeeded":
            invoice    = event["data"]["object"]
            cus_id     = getattr(invoice, "customer", None)
            billing_reason = getattr(invoice, "billing_reason", "") or ""

            if billing_reason == "subscription_cycle":
                items = list(users_container.query_items(
                    query="SELECT * FROM c WHERE c.stripe_customer_id = @cid",
                    parameters=[{"name": "@cid", "value": cus_id}],
                    enable_cross_partition_query=True,
                ))
                if items:
                    doc = items[0]
                    plano = doc.get("plano", 20)
                    renovacao = (datetime.utcnow() + timedelta(days=30)).isoformat()
                    doc["palavras_disponiveis"] = plano
                    doc["status"]   = "ativo"
                    doc["renovacao"] = renovacao
                    users_container.upsert_item(doc)
                    logging.info(f"[stripe-webhook] renewal for customer {cus_id}, plano={plano}")

        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            cus_id       = getattr(subscription, "customer", None)
            items = list(users_container.query_items(
                query="SELECT * FROM c WHERE c.stripe_customer_id = @cid",
                parameters=[{"name": "@cid", "value": cus_id}],
                enable_cross_partition_query=True,
            ))
            if items:
                doc = items[0]
                doc["status"] = "cancelado"
                users_container.upsert_item(doc)
                logging.info(f"[stripe-webhook] subscription cancelled for customer {cus_id}")

    except Exception as e:
        logging.error(f"[stripe-webhook] processing error: {e}")
        return func.HttpResponse(json.dumps({"ok": False, "error": str(e)}),
                                 status_code=200, mimetype="application/json")

    return func.HttpResponse(json.dumps({"ok": True}),
                             status_code=200, mimetype="application/json")

@app.route(route="version-check", methods=["GET"])
def version_check(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps({"version": "getattr-fix-2026-06-18", "deployed": True}),
        status_code=200, mimetype="application/json"
    )
