# Diagnóstico — Ambiente de Staging MANOA Custom English

Snapshot do estado de Produção **antes** de qualquer alteração, coletado em 2026-06-23.
Todos os comandos abaixo foram executados em modo leitura.

## Conta Azure

```
az account show
```
- Subscription: `Microsoft Partner Network` (`03d86465-cd2d-40e0-becf-a4b68c022dc7`)
- Tenant: `amistadnetworks.com.br` (`ca625181-0e4b-4c5d-ad4e-7d376b7112b8`)
- Usuário: `james@amistadnetworks.com.br`

## Function App de produção

```
az functionapp list -o table
```
- Nome: `func-manoa-custom-english`
- Resource Group: `rg-manoa-custom-english`
- Região: Brazil South
- Plano: `BrazilSouthLinuxDynamicPlan`

```
az functionapp show -n func-manoa-custom-english -g rg-manoa-custom-english
```
- `kind`: `functionapp,linux`
- `linuxFxVersion`: `Python|3.11`
- `httpsOnly`: **false** (nota de segurança, fora do escopo deste trabalho — recomendo revisar separadamente)
- Plan ID: `/subscriptions/.../resourceGroups/rg-manoa-custom-english/providers/Microsoft.Web/serverfarms/BrazilSouthLinuxDynamicPlan`

```
az functionapp plan show -g rg-manoa-custom-english -n BrazilSouthLinuxDynamicPlan
```
- SKU: `Y1` / tier `Dynamic` (Consumption), Linux

## Cosmos DB

```
az cosmosdb list -o table
```
- Conta: `cosmos-manoa-custom-english`
- Resource Group: `rg-manoa-custom-english`
- Região: Brazil South
- Capability: `EnableServerless` (conta **serverless** — não existe RU/s fixo para copiar; containers de staging também foram criados como serverless, herdando o modo da conta)

```
az cosmosdb sql database list --account-name cosmos-manoa-custom-english -g rg-manoa-custom-english
```
- Database: `manoa`

```
az cosmosdb sql container list --account-name cosmos-manoa-custom-english -g rg-manoa-custom-english -d manoa
```
| Container | Partition Key | Throughput |
|---|---|---|
| `words` | `/aluno_id` | serverless (sem RU/s fixo) |
| `users` | `/aluno_id` | serverless (sem RU/s fixo) |

## Nome do database no código

```
grep -rn "COSMOS\|get_database_client\|DatabaseProxy" backend
```
O nome `"manoa"` estava **fixo (hardcoded)** em duas funções (`get_cosmos_container` e `get_users_container`), em `backend/function_app.py`. Não havia variável de ambiente para isso — foi criada na Fase 1 (`COSMOS_DATABASE_NAME`, default `"manoa"`, preservando o comportamento de produção).

## Workflow do frontend (antes da mudança)

`.github/workflows/azure-static-web-apps.yml` disparava apenas em push/PR para `main`, sem nenhuma noção de staging.

## Workflow do backend (antes da mudança)

`.github/workflows/main_func-manoa-custom-english.yml` disparava apenas em push para `main`, autenticando via OIDC (`azure/login`) e publicando direto na Function App de produção via `Azure/functions-action@v1`, slot `Production`.

## Outras descobertas relevantes (não previstas no roteiro original, mas que afetam o staging)

1. **Stripe em produção já está configurado com uma chave de TESTE** (`STRIPE_SECRET_KEY` começa com `sk_test_...`), não uma chave Live como mencionado no contexto da tarefa. Isso é uma inconsistência de produção que recomendo o usuário revisar separadamente — não foi alterado aqui (regra de leitura/diagnóstico apenas).
2. **`success_url`/`cancel_url` do Stripe Checkout estavam hardcoded** para `https://manoacustomenglish.com`, ignorando a variável `FRONTEND_URL` que já existia no código mas nunca era usada. Isso foi corrigido na branch `staging` (ver `STAGING-SETUP.md`), sem alterar o comportamento de produção (o valor default de `FRONTEND_URL` é o mesmo domínio de produção).
3. **CORS (`ALLOWED_ORIGINS`) é uma lista fixa no código**, sem variável de ambiente. Foi adicionada a variável `EXTRA_ALLOWED_ORIGIN` para acomodar o domínio do frontend de staging, sem remover nenhuma origem de produção.
4. **O frontend não usa `STRIPE_PUBLISHABLE_KEY`/Stripe.js no lado do cliente** — o backend usa Stripe Checkout Sessions (redirect via URL), então não existe uma chave publicável a ser configurada no frontend. O secret `REACT_APP_STRIPE_PUBLISHABLE_KEY` mencionado no roteiro original não se aplica a este projeto e não foi criado.
5. **GitHub CLI (`gh`) não estava instalado** no ambiente — foi instalado localmente em `~/.local/bin/gh` (binário oficial, sem `sudo`) e autenticado usando o token presente na URL remota do git, para permitir a criação dos secrets via `gh secret set`.
