# Ambiente de Staging — MANOA Custom English

Ambiente de homologação totalmente separado de Produção, criado em 2026-06-23.
Ver decisões e descobertas detalhadas em [`staging-setup-diagnostico.md`](./staging-setup-diagnostico.md).

## URLs

| Ambiente | Frontend | Backend |
|---|---|---|
| **Produção** | https://manoacustomenglish.com | https://func-manoa-custom-english.azurewebsites.net |
| **Staging** | https://purple-smoke-0a58d0f0f-staging.eastus2.7.azurestaticapps.net | https://func-manoa-custom-english-staging.azurewebsites.net |

A URL de staging do frontend é gerada automaticamente pelo Azure (ambiente nativo "named environment" do mesmo recurso SWA, ligada à branch `staging`). Não é uma URL fixa escolhida por nós — caso o recurso SWA seja recriado, ela pode mudar.

## Estrutura criada

### Cosmos DB (mesma conta `cosmos-manoa-custom-english`)
- Novo database **`manoa-staging`**, com os containers `words` e `users`, mesmas partition keys (`/aluno_id`) dos containers de produção. Conta é *serverless*, então não há RU/s fixo a replicar.
- Produção continua usando o database `manoa`, sem nenhuma alteração.

### Backend
- Nova Function App **`func-manoa-custom-english-staging`**, mesmo Resource Group (`rg-manoa-custom-english`), mesma região (Brazil South), plano Consumption (Y1, novo plano dedicado, Linux/Python 3.11).
- Reaproveita a mesma Storage Account (`stmanoacustomenglish`) da produção para `AzureWebJobsStorage` (prática comum e suportada — não há custo adicional relevante; cada Function App usa um `WEBSITE_CONTENTSHARE` próprio dentro da mesma conta, sem conflito).
- Application Insights próprio (instância separada, criada automaticamente pelo Azure ao criar a Function App) — telemetria de staging não se mistura com a de produção.
- App Settings copiadas de produção, com as seguintes diferenças:
  - `COSMOS_DATABASE_NAME = manoa-staging`
  - `STRIPE_SECRET_KEY = PENDENTE_STRIPE_TEST_KEY` (placeholder)
  - `STRIPE_WEBHOOK_SECRET = PENDENTE_WEBHOOK_SECRET_STAGING` (placeholder)
  - `FRONTEND_URL = https://purple-smoke-0a58d0f0f-staging.eastus2.7.azurestaticapps.net`
  - `EXTRA_ALLOWED_ORIGIN = https://purple-smoke-0a58d0f0f-staging.eastus2.7.azurestaticapps.net` (libera CORS para o frontend de staging)
  - `ENABLE_ORYX_BUILD` / `SCM_DO_BUILD_DURING_DEPLOYMENT = true` (necessário para build remoto do `func azure functionapp publish`)
- **Importante**: o acesso por credenciais básicas (SCM/FTP "Basic Auth Publishing Credentials") teve que ser **habilitado** na Function App de staging — vem desabilitado por padrão em apps novos no Azure, e é exigido pelo método de deploy via *publish profile* usado no GitHub Actions. Isso foi feito apenas no recurso de staging, não em produção.
- Código alterado em `backend/function_app.py` (branch `staging`), de forma que produção mantém o comportamento idêntico (todos os defaults reproduzem o valor antigo fixo):
  - `get_cosmos_container()` / `get_users_container()` agora usam `os.environ.get("COSMOS_DATABASE_NAME", "manoa")` em vez do nome fixo `"manoa"`.
  - `success_url`/`cancel_url` do Stripe Checkout passaram a usar a variável `FRONTEND_URL` (já existia no código, mas nunca era usada — o default é o mesmo domínio de produção).
  - Nova variável `EXTRA_ALLOWED_ORIGIN` adicionada à lista de CORS `ALLOWED_ORIGINS` (vazia por padrão = sem efeito em produção).

### Frontend
- **Nenhum novo recurso Static Web App** foi criado. Foi usado o "named/staging environment" nativo do mesmo recurso `swa-manoa-custom-english`, via parâmetro `deployment_environment: staging` no workflow do GitHub Actions.
- Push na branch `main` continua gerando deploy no ambiente `default` (produção), sem nenhuma mudança.
- Push na branch `staging` gera deploy no ambiente nomeado `staging`, com a variável de build `REACT_APP_FUNCTION_URL` apontando para a Function App de staging.
- As variáveis do Firebase (`REACT_APP_FIREBASE_*`) são as **mesmas** usadas em produção (mesmo projeto Firebase, como pedido) — nenhum secret novo precisou ser criado para isso.
- **Não foi criado** `REACT_APP_STRIPE_PUBLISHABLE_KEY`: o frontend deste projeto não usa Stripe.js no navegador — o checkout é feito via *redirect* para uma URL de sessão gerada pelo backend (`stripe.checkout.Session.create`). Não há chave publicável a configurar.

### GitHub Secrets criados
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_STAGING` — publish profile da nova Function App de staging.
- `REACT_APP_FUNCTION_URL_STAGING` — `https://func-manoa-custom-english-staging.azurewebsites.net`.

### CI/CD — comportamento por branch
- `.github/workflows/azure-static-web-apps.yml`: dispara em push para `main` **e** `staging`. Branch determina o ambiente de destino e a URL da API injetada no build. PRs continuam só sendo avaliados contra `main`, como antes.
- `.github/workflows/main_func-manoa-custom-english.yml`: o job `build` é compartilhado; depois bifurca em dois jobs com `if` por branch:
  - `deploy-production` (branch `main`): idêntico ao workflow anterior — login via OIDC, deploy na Function App de produção, slot `Production`. **Comportamento inalterado.**
  - `deploy-staging` (branch `staging`, novo): deploy via *publish profile* na Function App `func-manoa-custom-english-staging`.

Ambos os pipelines foram validados: push na branch `staging` (commit `1c78253`) disparou e completou com sucesso tanto o deploy do frontend quanto do backend de staging.

## Fluxo de trabalho

1. Desenvolver e commitar na branch `staging` (ou abrir PR de uma feature branch para `staging`).
2. Push em `staging` → deploy automático no frontend de staging e na Function App de staging.
3. Testar em https://purple-smoke-0a58d0f0f-staging.eastus2.7.azurestaticapps.net.
4. Quando validado, abrir PR de `staging` para `main` e mergear → deploy automático em produção, sem nenhuma mudança de processo em relação ao que já existia.

## Checklist do que falta preencher manualmente

- [ ] **Chave de teste do Stripe**: substituir `PENDENTE_STRIPE_TEST_KEY` em `STRIPE_SECRET_KEY` da Function App `func-manoa-custom-english-staging` por uma chave `sk_test_...` real.
  ```
  az functionapp config appsettings set -n func-manoa-custom-english-staging -g rg-manoa-custom-english --settings "STRIPE_SECRET_KEY=sk_test_..."
  ```
- [ ] **Webhook secret de teste do Stripe**: criar um webhook endpoint de teste no Dashboard do Stripe apontando para `https://func-manoa-custom-english-staging.azurewebsites.net/api/stripe-webhook`, e substituir `PENDENTE_WEBHOOK_SECRET_STAGING` pelo `whsec_...` gerado.
  ```
  az functionapp config appsettings set -n func-manoa-custom-english-staging -g rg-manoa-custom-english --settings "STRIPE_WEBHOOK_SECRET=whsec_..."
  ```
- [ ] **(Opcional) CNAME no Cloudflare**: criar um registro CNAME `homolog.manoacustomenglish.com` apontando para `purple-smoke-0a58d0f0f-staging.eastus2.7.azurestaticapps.net`, e depois vincular o hostname customizado:
  ```
  az staticwebapp hostname set -n swa-manoa-custom-english -g rg-manoa-custom-english --hostname homolog.manoacustomenglish.com
  ```
  Se isso for feito, também adicionar `https://homolog.manoacustomenglish.com` à variável `EXTRA_ALLOWED_ORIGIN` da Function App de staging (ela aceita apenas uma origem hoje — trocar por lista separada por vírgula se for necessário mais de uma).
- [ ] **Revisar separadamente**: produção está atualmente configurada com uma chave de teste do Stripe (`sk_test_...`) em vez de uma chave Live — não é algo deste setup de staging, mas foi notado durante o diagnóstico e merece atenção própria.

## Observação sobre a regra de ouro

Nenhum recurso de produção foi alterado. Verificado ao final do processo:
- App Settings da Function App de produção: idênticas às do início.
- Ambiente `default` (produção) do Static Web App: `LastUpdatedOn` inalterado desde antes deste trabalho.
- `version-check` da Function App de produção: mesma versão de antes.
