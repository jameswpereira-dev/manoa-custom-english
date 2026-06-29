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

// Mercado Pago one-time Pix plan — separate from Stripe subscriptions
export const PIX_PLAN = {
  tier:  'Pix-10',
  limit: 10,
  price: 'R$ 39,90',
  days:  30,
};
