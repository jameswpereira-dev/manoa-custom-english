import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscription } from '../services/api';

const NAVY = '#1E3A6A';

export default function CheckoutSuccess() {
  const nav               = useNavigate();
  const [active, setActive]   = useState(false);
  const [gaveUp, setGaveUp]   = useState(false);

  useEffect(() => {
    let tries = 0;
    const MAX  = 15; // poll up to 30s (every 2s)

    const id = setInterval(async () => {
      tries++;
      try {
        const data = await getSubscription();
        if (data?.status === 'ativo') {
          setActive(true);
          clearInterval(id);
          return;
        }
      } catch { /* keep polling */ }
      if (tries >= MAX) {
        clearInterval(id);
        setGaveUp(true);
      }
    }, 2000);

    return () => clearInterval(id);
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
            onClick={() => nav('/dashboard')}
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
              onClick={() => nav('/dashboard')}
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
