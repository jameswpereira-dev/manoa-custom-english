import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logoManoa from '../logo-manoa.png';
import { PLAN_CATALOG } from '../config/plans';

const NAVY = '#1E3A6A';
const RED  = '#B22234';

const PLANS = PLAN_CATALOG.map(p => ({
  id:      p.tier,
  label:   p.tier,
  price:   p.price,
  words:   `${p.limit} palavras/mês`,
  popular: p.popular,
}));

const FEATURES = [
  'Geração automática de vocabulário',
  'Exercícios personalizados por IA',
  'Áudio com pronúncia nativa',
  'Listening interativo',
];

export default function Planos() {
  const nav        = useNavigate();
  const { user }   = useAuth();

  const handleAssinar = (planId) => {
    nav(user ? `/checkout?plan=${planId}` : `/cadastro?plan=${planId}`);
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: '100vh', background: '#f1f5f9' }}>

      {/* Header */}
      <header style={{
        background: NAVY, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, boxShadow: '0 2px 12px rgba(0,0,0,.22)',
      }}>
        <button
          onClick={() => nav('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <img src={logoManoa} alt="MANOA" style={{ height: 28 }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>MANOA</span>
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <NavBtn onClick={() => nav('/dashboard')}>Meu painel</NavBtn>
          ) : (
            <NavBtn ghost onClick={() => nav('/login')}>Entrar</NavBtn>
          )}
        </div>
      </header>

      {/* Plans */}
      <section style={{ padding: 'clamp(56px, 8vw, 88px) 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{
            textAlign: 'center', color: NAVY,
            fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, marginBottom: 10,
          }}>
            Escolha seu plano
          </h1>
          <p style={{
            textAlign: 'center', color: '#64748b', marginBottom: 52,
            fontSize: '.95rem', maxWidth: 520, margin: '0 auto 52px',
          }}>
            Todos os planos incluem exercícios personalizados, áudio nativo e listening interativo.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 28, alignItems: 'start',
          }}>
            {PLANS.map(p => (
              <div key={p.id} style={{
                background: p.popular ? NAVY : '#fff',
                color: p.popular ? '#fff' : '#1e293b',
                borderRadius: 18, padding: '40px 28px 32px',
                boxShadow: p.popular
                  ? '0 12px 40px rgba(30,58,106,.28)'
                  : '0 2px 14px rgba(0,0,0,.07)',
                border: p.popular ? 'none' : '1.5px solid #e2e8f0',
                transform: p.popular ? 'scale(1.04)' : 'none',
                position: 'relative', textAlign: 'center',
              }}>
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: -15, left: '50%',
                    transform: 'translateX(-50%)',
                    background: RED, color: '#fff',
                    fontSize: '.73rem', fontWeight: 700,
                    padding: '4px 18px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>
                    ⭐ Mais popular
                  </div>
                )}

                <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: 6, color: p.popular ? '#93c5fd' : '#64748b' }}>
                  {p.label}
                </h3>
                <div style={{ fontSize: 'clamp(2rem, 5vw, 2.6rem)', fontWeight: 800, marginBottom: 2 }}>
                  {p.price}
                </div>
                <div style={{ fontSize: '.84rem', opacity: .7, marginBottom: 20 }}>/mês</div>

                <div style={{
                  background: p.popular ? 'rgba(255,255,255,.12)' : '#f1f5f9',
                  borderRadius: 9, padding: '10px 16px',
                  fontSize: '.92rem', fontWeight: 600, marginBottom: 28,
                  color: p.popular ? '#fff' : NAVY,
                }}>
                  {p.words}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', textAlign: 'left' }}>
                  {FEATURES.map(feat => (
                    <li key={feat} style={{ fontSize: '.87rem', marginBottom: 9, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: p.popular ? '#93c5fd' : RED, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span style={{ opacity: p.popular ? .88 : 1 }}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleAssinar(p.id)}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 9,
                    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                    background: p.popular ? RED : NAVY,
                    color: '#fff', border: 'none',
                    boxShadow: p.popular ? '0 4px 18px rgba(178,34,52,.38)' : 'none',
                    transition: 'filter .15s, transform .1s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
                >
                  Assinar
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function NavBtn({ children, onClick, ghost }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: ghost ? 'transparent' : 'rgba(255,255,255,.15)',
        color: '#fff',
        border: ghost ? '1.5px solid rgba(255,255,255,.5)' : '1.5px solid transparent',
        padding: '7px 18px', borderRadius: 7,
        fontSize: '.88rem', fontWeight: 500, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
