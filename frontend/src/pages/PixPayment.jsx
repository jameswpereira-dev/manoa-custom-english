import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPixPayment, getSubscription } from '../services/api';
import { PIX_AVULSO_BY_TIER, PIX_AVULSO_DEFAULT_TIER } from '../config/pixPlans';

const NAVY  = '#1E3A6A';
const GREEN = '#16a34a';
const EXPIRY_SECS = 30 * 60;

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function PixPayment() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier') || PIX_AVULSO_DEFAULT_TIER;
  const planInfo = PIX_AVULSO_BY_TIER[tier] || PIX_AVULSO_BY_TIER[PIX_AVULSO_DEFAULT_TIER];

  const [phase, setPhase]       = useState('loading'); // loading|showing|paid|expired|error
  const [pixData, setPixData]   = useState(null);
  const [copied, setCopied]     = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECS);
  const [errMsg, setErrMsg]     = useState('');
  const pollRef  = useRef(null);
  const timerRef = useRef(null);

  const stopAll = useCallback(() => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    createPixPayment(tier)
      .then(data => {
        setPixData(data);
        setPhase('showing');

        pollRef.current = setInterval(async () => {
          try {
            const sub = await getSubscription();
            if (sub.status === 'ativo') {
              stopAll();
              setPhase('paid');
              setTimeout(() => nav('/dashboard'), 2500);
            }
          } catch {}
        }, 3000);

        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) { stopAll(); setPhase('expired'); return 0; }
            return t - 1;
          });
        }, 1000);
      })
      .catch(err => {
        setErrMsg(err.response?.data?.error || 'Erro ao criar pagamento Pix. Tente novamente.');
        setPhase('error');
      });

    return stopAll;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copyCode = () => {
    navigator.clipboard?.writeText(pixData?.qr_code || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (phase === 'loading') {
    return (
      <Screen>
        <Spinner />
        <p style={{ color: '#94a3b8', marginTop: 16 }}>Gerando código Pix…</p>
      </Screen>
    );
  }

  if (phase === 'error') {
    return (
      <Screen>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <p style={{ color: '#ef4444', marginBottom: 28, lineHeight: 1.6 }}>{errMsg}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <PrimaryBtn onClick={() => window.location.reload()}>Tentar novamente</PrimaryBtn>
            <GhostBtn onClick={() => nav('/planos')}>← Voltar</GhostBtn>
          </div>
        </div>
      </Screen>
    );
  }

  if (phase === 'paid') {
    return (
      <Screen>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ color: GREEN, fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
            Pagamento confirmado!
          </h2>
          <p style={{ color: '#475569' }}>
            Acesso de 30 dias com {planInfo.limit} palavras ativado. Redirecionando…
          </p>
        </div>
      </Screen>
    );
  }

  if (phase === 'expired') {
    return (
      <Screen>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏰</div>
          <h2 style={{ color: '#ef4444', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
            Pix expirado
          </h2>
          <p style={{ color: '#475569', marginBottom: 28, lineHeight: 1.6 }}>
            O QR code expirou sem confirmação de pagamento.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <PrimaryBtn onClick={() => window.location.reload()}>Gerar novo Pix</PrimaryBtn>
            <GhostBtn onClick={() => nav('/planos')}>← Voltar</GhostBtn>
          </div>
        </div>
      </Screen>
    );
  }

  const urgent = timeLeft < 120;

  return (
    <Screen>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <button
          onClick={() => nav('/planos')}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '.85rem', marginBottom: 24, display: 'block' }}
        >
          ← Voltar e escolher outro plano
        </button>

        <h2 style={{ color: NAVY, fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>
          Pagar com Pix
        </h2>
        <p style={{ color: '#64748b', marginBottom: 6, fontSize: '.9rem' }}>
          {planInfo.limit} palavras · 30 dias de acesso · <strong>{planInfo.price}</strong> (pagamento único)
        </p>
        <div style={{
          fontSize: '.85rem', fontWeight: 700, marginBottom: 24,
          color: urgent ? '#ef4444' : '#64748b',
        }}>
          Expira em {fmt(timeLeft)}
        </div>

        {pixData?.qr_code_base64 ? (
          <img
            src={`data:image/png;base64,${pixData.qr_code_base64}`}
            alt="QR Code Pix"
            style={{
              width: 220, height: 220, borderRadius: 12,
              border: '2px solid #e2e8f0', display: 'block', margin: '0 auto 20px',
            }}
          />
        ) : (
          <div style={{
            width: 220, height: 220, background: '#f1f5f9', borderRadius: 12,
            margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', fontSize: '.82rem', border: '1.5px solid #e2e8f0',
          }}>
            QR Code indisponível
          </div>
        )}

        {pixData?.qr_code && (
          <>
            <p style={{ fontSize: '.82rem', color: '#64748b', marginBottom: 8 }}>
              Ou use o Pix Copia e Cola:
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{
                flex: 1, background: '#f8fafc', border: '1.5px solid #e2e8f0',
                borderRadius: 8, padding: '10px 14px',
                fontSize: '.73rem', color: '#475569',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                textAlign: 'left',
              }}>
                {pixData.qr_code}
              </div>
              <button
                onClick={copyCode}
                style={{
                  background: copied ? GREEN : NAVY, color: '#fff',
                  border: 'none', borderRadius: 8, padding: '0 18px',
                  fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                  transition: 'background .2s',
                }}
              >
                {copied ? '✓' : 'Copiar'}
              </button>
            </div>
          </>
        )}

        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 10, padding: '14px 18px',
          fontSize: '.82rem', color: '#166534', textAlign: 'left', lineHeight: 1.7,
          marginBottom: 20,
        }}>
          <strong>Como pagar:</strong><br />
          1. Abra o app do seu banco<br />
          2. Escolha <strong>Pix → QR Code</strong> ou <strong>Pix Copia e Cola</strong><br />
          3. Escaneie o QR ou cole o código acima<br />
          4. Confirme o valor de {planInfo.price}<br />
          5. A confirmação aparece automaticamente nesta tela
        </div>

        <p style={{ fontSize: '.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Aguardando confirmação do pagamento…
        </p>
      </div>
    </Screen>
  );
}

function Screen({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 40, height: 40,
      border: '4px solid #e2e8f0',
      borderTop: `4px solid ${NAVY}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PrimaryBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: NAVY, color: '#fff', border: 'none',
      padding: '11px 24px', borderRadius: 8,
      fontSize: '.9rem', fontWeight: 600, cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', color: '#64748b',
      border: '1px solid #cbd5e1', padding: '11px 24px',
      borderRadius: 8, fontSize: '.9rem', cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}
