import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../services/api';

const NAVY = '#1E3A6A';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const nav            = useNavigate();
  const plan           = searchParams.get('plan');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const startCheckout = () => {
    setLoading(true);
    setError('');
    createCheckoutSession(parseInt(plan, 10))
      .then(data => {
        if (data?.url) {
          window.location.href = data.url;
        } else {
          setLoading(false);
          setError('Não foi possível criar a sessão de pagamento.');
        }
      })
      .catch(err => {
        setLoading(false);
        setError(err.response?.data?.error || 'Erro ao iniciar o checkout. Tente novamente.');
      });
  };

  useEffect(() => {
    if (!plan) { nav('/'); return; }
    startCheckout();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#f8fafc', padding: 24,
    }}>
      {error ? (
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>⚠️</div>
          <p style={{ color: '#ef4444', fontSize: '1rem', marginBottom: 24, lineHeight: 1.6 }}>{error}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={startCheckout}
              style={{
                background: NAVY, color: '#fff', border: 'none',
                padding: '11px 28px', borderRadius: 8,
                fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Tentar novamente
            </button>
            <button
              onClick={() => nav('/')}
              style={{
                background: 'transparent', color: '#64748b',
                border: '1px solid #cbd5e1',
                padding: '11px 28px', borderRadius: 8,
                fontSize: '1rem', cursor: 'pointer',
              }}
            >
              ← Voltar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button
            disabled
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: NAVY, color: '#fff', border: 'none',
              padding: '14px 32px', borderRadius: 10,
              fontSize: '1rem', fontWeight: 600, cursor: 'not-allowed',
              opacity: 0.85,
            }}
          >
            <Spinner size={18} />
            Aguarde…
          </button>
          <p style={{ color: '#475569', marginTop: 18, fontSize: '0.9rem' }}>
            Preparando o pagamento seguro…
          </p>
        </div>
      )}
    </div>
  );
}

function Spinner({ size = 22 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `${Math.max(2, size / 9)}px solid rgba(255,255,255,0.3)`,
      borderTop: `${Math.max(2, size / 9)}px solid #fff`,
      borderRadius: '50%',
      animation: 'spin .75s linear infinite',
      flexShrink: 0,
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
