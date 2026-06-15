# MANOA Custom English

Plataforma de aprendizado personalizado de inglês.

## URLs

- **Frontend**: https://purple-smoke-0a58d0f0f.7.azurestaticapps.net
- **Backend**: https://func-manoa-custom-english.azurewebsites.net
- **SWA Nome**: swa-manoa-custom-english
- **Function App**: func-manoa-custom-english

## Recursos Azure (rg-manoa-custom-english, Brazil South)

| Recurso | Nome |
|---------|------|
| Static Web App | swa-manoa-custom-english |
| Function App (Python 3.11) | func-manoa-custom-english |
| Storage Account | stmanoacustomenglish |
| Cosmos DB (Serverless) | cosmos-manoa-custom-english |

## ⚡ PRÓXIMO PASSO: Configurar Firebase

Execute:
```bash
cd /home/amistad/manoa
bash setup-firebase.sh
```

O script irá:
1. Fazer login no Firebase
2. Criar o projeto `manoa-custom-english`
3. Pedir para você habilitar Email/Password + Google no console
4. Registrar o app web e obter as chaves
5. Pedir ANTHROPIC_API_KEY e ELEVENLABS_API_KEY
6. Atualizar o .env, fazer build e deploy final

## Deploy manual

### Frontend
```bash
cd /home/amistad/manoa/frontend
# Edite o .env com as chaves Firebase reais
npm run build
SWA_TOKEN=$(az staticwebapp secrets list --name swa-manoa-custom-english --query "properties.apiKey" -o tsv)
swa deploy build --deployment-token "$SWA_TOKEN" --env production
```

### Backend
```bash
cd /home/amistad/manoa/backend
func azure functionapp publish func-manoa-custom-english --python
```

## Variáveis de ambiente da Function App

Configure via Azure Portal ou CLI:
- `ANTHROPIC_API_KEY` — Anthropic API key
- `ELEVENLABS_API_KEY` — ElevenLabs API key
- `FIREBASE_PROJECT_ID` — ID do projeto Firebase
- `FIREBASE_WEB_API_KEY` — Web API key do Firebase
- `COSMOS_CONNECTION_STRING` — ✅ Já configurado
- `STORAGE_CONNECTION_STRING` — ✅ Já configurado
- `STORAGE_ACCOUNT_NAME` — ✅ Já configurado (stmanoacustomenglish)
