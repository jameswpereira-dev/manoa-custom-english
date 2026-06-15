#!/bin/bash
# Run this script once to create Stripe products and prices.
# Usage: STRIPE_SECRET_KEY=sk_test_xxx bash create-stripe-products.sh

KEY="${STRIPE_SECRET_KEY:?Set STRIPE_SECRET_KEY before running this script}"

create_price() {
  local name="$1" words="$2" cents="$3"

  prod_id=$(curl -s https://api.stripe.com/v1/products \
    -u "$KEY:" \
    -d "name=MANOA $name" \
    -d "description=$words palavras por mês — MANOA Custom English" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

  price_id=$(curl -s https://api.stripe.com/v1/prices \
    -u "$KEY:" \
    -d "product=$prod_id" \
    -d "unit_amount=$cents" \
    -d "currency=brl" \
    -d "recurring[interval]=month" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

  echo "STRIPE_PRICE_ID_${words}=${price_id}"
}

echo ""
echo "=== Criando produtos no Stripe ==="
echo ""
create_price "Plano 20" 20 2990
create_price "Plano 30" 30 3990
create_price "Plano 40" 40 4990
echo ""
echo "=== Copie os IDs acima para o Azure App Settings e local.settings.json ==="
