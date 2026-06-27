import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyPayment, getSubscription } from '../services/api';
import { useSubscription } from '../contexts/SubscriptionContext';

const NAVY = '#1E3A6A';

export default function CheckoutSuccess() {
  const nav                   = useNavigate();
  const [searchParams]        = useSearchParams();
  const { refetch }           = useSubscription();
  const [active, setActive]   = useState(false);
  const [gaveUp, setGaveUp]   = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    let cancelled = false;

    async function activate() {
      // Primary path: use session_id to confirm payment directly with Stripe API.
      // This works even when the Stripe webhook has delivery issues.
      if (sessionId) {
        try {
          const data = await verifyPayment(sessionId);
          if (!cancelled && data?.status === 'ativo') {
            refetch();
            setActive(true);
            return;
          }
        } catch { /* fall through to polling */ }
      }

      // Fallback: poll get-subscription (catches webhook-activated subscriptions)
      let tries = 0;
      const MAX = 15; // 30s at 2s interval

      const id = setInterval(async () => {
        tries++;
        try {
          const data = await getSubscription();
          if (!cancelled && data?.status === 'ativo') {
            clearInterval(id);
            refetch();
            setActive(true);
            return;
          }
        } catch { /* keep polling */ }
        if (tries >= MAX) {
          clearInterval(id);
          if (!cancelled) setGaveUp(true);
        }
      }, 2000);

      return () => clearInterval(id);
    }

    activate();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#f1f5f9', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: 'clamp(36px, 6vw, 56px) clamp(24px, 6vw, 48px)',
        maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: '0 4px 28px rgba(0,0,0,.09)',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 18 }}>🎉</div>

        <h1 style={{ color: NAVY, fontWeight: 800, fontSize: '1.65rem', marginBottom: 10 }}>
          Pagamento confirmado!
        </h1>

        <p style={{ color: '#475569', lineHeight: 1.75, marginBottom: 32, fontSize: '.97rem' }}>
          Bem-vindo à MANOA Custom English!<br />
          Seu plano está sendo ativado — em instantes você terá acesso completo.
        </p>

        {active ? (
          <button
            onClick={async () => { await refetch(); nav('/dashboard'); }}
            style={{
              background: NAVY, color: '#fff', border: 'none',
              padding: '14px 36px', borderRadius: 10,
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              transition: 'filter .15s',
            }}
            onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseOut={e => e.currentTarget.style.filter = ''}
          >
            Ir para o painel →
          </button>
        ) : gaveUp ? (
          <>
            <p style={{ color: '#94a3b8', fontSize: '.88rem', marginBottom: 20 }}>
              A ativação está demorando um pouco mais. Clique abaixo para entrar —
              o plano estará ativo em alguns minutos.
            </p>
            <button
              onClick={async () => { await refetch(); nav('/dashboard'); }}
              style={{
                background: NAVY, color: '#fff', border: 'none',
                padding: '14px 36px', borderRadius: 10,
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Ir para o painel →
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <MiniSpinner />
            <span style={{ color: '#94a3b8', fontSize: '.92rem' }}>Ativando plano…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniSpinner() {
  return (
    <div style={{
      width: 18, height: 18,
      border: '2.5px solid #e2e8f0',
      borderTop: `2.5px solid ${NAVY}`,
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
