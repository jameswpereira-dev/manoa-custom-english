// Catálogo do pacote avulso via Pix (Mercado Pago) — totalmente separado do
// catálogo de assinaturas Stripe, que permanece local em Planos.jsx / PlanPicker.jsx.
export const PIX_AVULSO_DEFAULT_TIER = 'avulso_10';

export const PIX_AVULSO_CATALOG = [
  { tier: 'avulso_10', limit: 10, price: 'R$ 39,90' },
];

export const PIX_AVULSO_BY_TIER = Object.fromEntries(
  PIX_AVULSO_CATALOG.map(p => [p.tier, p])
);
