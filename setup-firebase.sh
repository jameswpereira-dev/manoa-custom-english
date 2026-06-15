#!/bin/bash
# =============================================================================
# MANOA Custom English — Firebase Setup Script
# Execute este script UMA VEZ para configurar o Firebase.
# =============================================================================

set -e

FUNCTION_APP="func-manoa-custom-english"
RESOURCE_GROUP="rg-manoa-custom-english"
FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"

echo ""
echo "=============================================="
echo "  MANOA Custom English — Firebase Setup"
echo "=============================================="
echo ""

# 1. Login Firebase
echo "→ Fazendo login no Firebase (abrirá o navegador)..."
firebase login

# 2. Criar projeto Firebase
echo ""
echo "→ Criando projeto Firebase 'manoa-custom-english'..."
firebase projects:create manoa-custom-english --display-name "MANOA Custom English" || \
  echo "  (Projeto pode já existir — continuando...)"

# 3. Usar o projeto
firebase use manoa-custom-english 2>/dev/null || true

# 4. Habilitar Authentication via REST API
echo ""
echo "→ Habilitando Firebase Authentication..."
PROJECT_ID="manoa-custom-english"
ACCESS_TOKEN=$(firebase login:ci --no-localhost 2>/dev/null || gcloud auth print-access-token 2>/dev/null || echo "")

echo ""
echo "=============================================="
echo "  AÇÃO MANUAL NECESSÁRIA (30 segundos):"
echo "=============================================="
echo ""
echo "1. Acesse: https://console.firebase.google.com/project/manoa-custom-english/authentication"
echo "2. Clique em 'Get started'"
echo "3. Habilite 'Email/Password'"
echo "4. Habilite 'Google' (adicione e-mail de suporte: jameswpereira@gmail.com)"
echo ""
read -p "Pressione ENTER quando tiver feito as etapas acima..."

# 5. Obter configuração do Firebase App
echo ""
echo "→ Registrando app web no Firebase..."
FIREBASE_CONFIG=$(firebase apps:create WEB "MANOA Web App" --project manoa-custom-english 2>&1)
APP_ID=$(echo "$FIREBASE_CONFIG" | grep -o 'App ID: [^ ]*' | awk '{print $3}' || echo "")

if [ -z "$APP_ID" ]; then
  echo ""
  echo "=============================================="
  echo "  COPIE AS CONFIGURAÇÕES DO FIREBASE:"
  echo "=============================================="
  echo ""
  echo "1. Acesse: https://console.firebase.google.com/project/manoa-custom-english/settings/general"
  echo "2. Role até 'Your apps' → 'Add app' → Web (</>)"
  echo "3. App nickname: MANOA Web"
  echo "4. Copie o firebaseConfig e preencha abaixo:"
  echo ""
  read -p "  REACT_APP_FIREBASE_API_KEY: " FB_API_KEY
  read -p "  REACT_APP_FIREBASE_AUTH_DOMAIN: " FB_AUTH_DOMAIN
  read -p "  REACT_APP_FIREBASE_PROJECT_ID: " FB_PROJECT_ID
  read -p "  REACT_APP_FIREBASE_STORAGE_BUCKET: " FB_STORAGE_BUCKET
  read -p "  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: " FB_MSG_ID
  read -p "  REACT_APP_FIREBASE_APP_ID: " FB_APP_ID
else
  SDK_CONFIG=$(firebase apps:sdkconfig WEB "$APP_ID" --project manoa-custom-english 2>&1)
  FB_API_KEY=$(echo "$SDK_CONFIG" | grep apiKey | sed 's/.*"\(.*\)".*/\1/')
  FB_AUTH_DOMAIN=$(echo "$SDK_CONFIG" | grep authDomain | sed 's/.*"\(.*\)".*/\1/')
  FB_PROJECT_ID="manoa-custom-english"
  FB_STORAGE_BUCKET=$(echo "$SDK_CONFIG" | grep storageBucket | sed 's/.*"\(.*\)".*/\1/')
  FB_MSG_ID=$(echo "$SDK_CONFIG" | grep messagingSenderId | sed 's/.*"\(.*\)".*/\1/')
  FB_APP_ID=$(echo "$SDK_CONFIG" | grep '"appId"' | sed 's/.*"\(.*\)".*/\1/')
fi

# 6. Pedir API Keys
echo ""
read -p "→ Cole sua ANTHROPIC_API_KEY: " ANTHROPIC_KEY
read -p "→ Cole sua ELEVENLABS_API_KEY: " ELEVENLABS_KEY

# 7. Atualizar .env do frontend
echo ""
echo "→ Atualizando .env do frontend..."
cat > "${FRONTEND_DIR}/.env" <<EOF
REACT_APP_FIREBASE_API_KEY=${FB_API_KEY}
REACT_APP_FIREBASE_AUTH_DOMAIN=${FB_AUTH_DOMAIN}
REACT_APP_FIREBASE_PROJECT_ID=${FB_PROJECT_ID}
REACT_APP_FIREBASE_STORAGE_BUCKET=${FB_STORAGE_BUCKET}
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${FB_MSG_ID}
REACT_APP_FIREBASE_APP_ID=${FB_APP_ID}
REACT_APP_FUNCTION_URL=https://func-manoa-custom-english.azurewebsites.net
EOF

# 8. Atualizar Function App settings
echo "→ Atualizando variáveis da Function App..."
az functionapp config appsettings set \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    "ANTHROPIC_API_KEY=${ANTHROPIC_KEY}" \
    "ELEVENLABS_API_KEY=${ELEVENLABS_KEY}" \
    "FIREBASE_PROJECT_ID=${FB_PROJECT_ID}" \
    "FIREBASE_WEB_API_KEY=${FB_API_KEY}" \
  --output none

# 9. Build + deploy frontend
echo ""
echo "→ Fazendo build do React..."
cd "${FRONTEND_DIR}"
npm run build

echo ""
echo "→ Fazendo deploy no Azure SWA..."
SWA_TOKEN=$(az staticwebapp secrets list \
  --name swa-manoa-custom-english \
  --query "properties.apiKey" -o tsv)

swa deploy "${FRONTEND_DIR}/build" \
  --deployment-token "$SWA_TOKEN" \
  --env production

echo ""
echo "=============================================="
echo "  ✅ MANOA Custom English está no ar!"
echo "=============================================="
echo ""
echo "  URL: https://purple-smoke-0a58d0f0f.7.azurestaticapps.net"
echo "  Function App: https://func-manoa-custom-english.azurewebsites.net"
echo ""
echo "  Para domínio personalizado:"
echo "  az staticwebapp hostname set --name swa-manoa-custom-english \\"
echo "    --resource-group rg-manoa-custom-english \\"
echo "    --hostname seu-dominio.com"
echo ""
