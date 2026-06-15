import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../services/api';

const NAVY = '#1E3A6A';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const nav            = useNavigate();
  const plan           = searchParams.get('plan');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plan) { nav('/'); return; }

    createCheckoutSession(parseInt(plan, 10))
      .then(data => {
        if (data?.url) {
          window.location.href = data.url;
        } else {
          setError('Não foi possível criar a sessão de pagamento.');
        }
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Erro ao iniciar o checkout. Tente novamente.');
      });
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
          <p style={{ color: '#ef4444', fontSize: '1rem', marginBottom: 20, lineHeight: 1.6 }}>{error}</p>
          <button
            onClick={() => nav('/')}
            style={{
              background: NAVY, color: '#fff', border: 'none',
              padding: '11px 28px', borderRadius: 8,
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            ← Voltar
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <Spinner />
          <p style={{ color: '#475569', marginTop: 22, fontSize: '1rem' }}>
            Redirecionando para o pagamento…
          </p>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 52, height: 52,
      border: '4px solid #e2e8f0',
      borderTop: `4px solid ${NAVY}`,
      borderRadius: '50%',
      animation: 'spin .8s linear infinite',
      margin: '0 auto',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
