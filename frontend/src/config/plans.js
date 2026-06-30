// Central plan catalog — single source of truth for the frontend.
// Mirrors the PLAN_CATALOG in backend/function_app.py.
// tier → { limit (words), price (display), popular }
export const PLAN_CATALOG = [
  { tier: 'Starter',      limit: 10, price: 'R$ 29,90', popular: false },
  { tier: 'Professional', limit: 15, price: 'R$ 39,90', popular: true  },
  { tier: 'Expert',       limit: 20, price: 'R$ 49,90', popular: false },
];

export const PLAN_BY_TIER = Object.fromEntries(
  PLAN_CATALOG.map(p => [p.tier, p])
);

// Mercado Pago avulso Pix plans — separate from Stripe subscriptions.
// tier → { limit (words), price (display string) }
export const PIX_AVULSO_CATALOG = [
  { tier: 'avulso_10', limit: 10, price: 'R$ 39,90' },
  { tier: 'avulso_15', limit: 15, price: 'R$ 49,90' },
  { tier: 'avulso_20', limit: 20, price: 'R$ 59,90' },
];

export const PIX_AVULSO_BY_TIER = Object.fromEntries(
  PIX_AVULSO_CATALOG.map(p => [p.tier, p])
);
