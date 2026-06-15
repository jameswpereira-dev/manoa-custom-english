import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logoManoa from '../logo-manoa.png';

const NAVY = '#1E3A6A';
const RED  = '#B22234';

const PLANS = [
  { id: 20, label: 'Plano 20', price: 'R$ 29,90', words: '20 palavras/mês', popular: false },
  { id: 30, label: 'Plano 30', price: 'R$ 39,90', words: '30 palavras/mês', popular: true  },
  { id: 40, label: 'Plano 40', price: 'R$ 49,90', words: '40 palavras/mês', popular: false },
];

const STEPS = [
  {
    num: '01', icon: '🏢',
    title: 'Você informa sua área profissional',
    desc:  'Diz para a MANOA em que setor você trabalha — TI, Direito, Medicina, Engenharia ou qualquer outra área.',
  },
  {
    num: '02', icon: '✨',
    title: 'A MANOA gera palavras e expressões',
    desc:  'Nossa IA seleciona vocabulário, phrasal verbs e expressões idiomáticas realmente usadas na sua profissão.',
  },
  {
    num: '03', icon: '🎧',
    title: 'Você pratica com exercícios e áudio',
    desc:  'Exercícios de lacuna, múltipla escolha e listening com pronúncia nativa — personalizados para você.',
  },
];

const FEATURES = [
  'Geração automática de vocabulário',
  'Exercícios personalizados por IA',
  'Áudio com pronúncia nativa',
  'Listening interativo',
];

export default function LandingPage() {
  const nav      = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const planosRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('planos') === '1' && planosRef.current) {
      setTimeout(() => planosRef.current.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, [location.search]);

  const handleAssinar = (plan) => {
    nav(user ? `/checkout?plan=${plan}` : `/cadastro?plan=${plan}`);
  };

  const scrollToPlanos = () =>
    planosRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", margin: 0, padding: 0, overflowX: 'hidden' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{
        background: NAVY, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,.22)',
      }}>
        <LogoBrand />
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <NavBtn onClick={() => nav('/dashboard')}>Meu painel</NavBtn>
          ) : (
            <>
              <NavBtn ghost onClick={() => nav('/login')}>Entrar</NavBtn>
              <NavBtn onClick={scrollToPlanos}>Ver planos</NavBtn>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, ${NAVY} 0%, #2a4f8a 60%, #1a3a70 100%)`,
        color: '#fff', padding: 'clamp(64px, 10vw, 100px) 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: RED, color: '#fff',
            fontSize: '.75rem', fontWeight: 700, padding: '4px 16px',
            borderRadius: 20, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 28,
          }}>
            Inglês profissional personalizado
          </div>

          <h1 style={{
            fontSize: 'clamp(1.75rem, 4.5vw, 2.9rem)', fontWeight: 800,
            lineHeight: 1.2, marginBottom: 22,
          }}>
            Já tem a base?<br />
            Agora adicione palavras e expressões<br />
            <span style={{ color: '#93c5fd' }}>usadas na sua profissão.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(.95rem, 2vw, 1.1rem)', color: 'rgba(255,255,255,.82)',
            maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.75,
          }}>
            A MANOA usa inteligência artificial para gerar vocabulário e expressões do seu setor —
            com exercícios, áudio e pronúncia nativa para você aprender de verdade.
          </p>

          <button
            onClick={scrollToPlanos}
            style={{
              background: RED, color: '#fff', border: 'none',
              padding: '15px 40px', borderRadius: 10,
              fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(178,34,52,.45)',
              transition: 'transform .15s, filter .15s',
            }}
            onMouseOver={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
          >
            Escolha seu plano ↓
          </button>
        </div>
      </section>

      {/* ── Como funciona ───────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: 'clamp(56px, 8vw, 88px) 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center', color: NAVY,
            fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, marginBottom: 56,
          }}>
            Como funciona
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 48,
          }}>
            {STEPS.map(s => (
              <div key={s.num} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: NAVY, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.82rem', fontWeight: 700, letterSpacing: 1,
                  margin: '0 auto 18px',
                }}>
                  {s.num}
                </div>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ color: NAVY, fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}>
                  {s.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: '.9rem', lineHeight: 1.75 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ──────────────────────────────────────────────────────── */}
      <section ref={planosRef} id="planos" style={{ background: '#f1f5f9', padding: 'clamp(56px, 8vw, 88px) 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center', color: NAVY,
            fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, marginBottom: 10,
          }}>
            Escolha seu plano
          </h2>
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

                <h3 style={{
                  fontSize: '.95rem', fontWeight: 700, marginBottom: 6,
                  color: p.popular ? '#93c5fd' : '#64748b',
                }}>
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
                    <li key={feat} style={{
                      fontSize: '.87rem', marginBottom: 9,
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                    }}>
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

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        background: NAVY, color: 'rgba(255,255,255,.7)',
        padding: '44px 24px', textAlign: 'center',
      }}>
        <LogoBrand centered />
        <p style={{ marginTop: 18, fontSize: '.88rem' }}>@manoacustomenglish</p>
        <p style={{ fontSize: '.88rem', marginTop: 4 }}>manoacustomenglish.com</p>
        <p style={{ fontSize: '.75rem', marginTop: 24, opacity: .45 }}>
          © 2025 MANOA Custom English. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
        transition: 'all .15s',
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,.2)'; }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = ghost ? 'rgba(255,255,255,.5)' : 'transparent';
        e.currentTarget.style.background  = ghost ? 'transparent' : 'rgba(255,255,255,.15)';
      }}
    >
      {children}
    </button>
  );
}

function LogoBrand({ centered }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      justifyContent: centered ? 'center' : 'flex-start',
    }}>
      <img src={logoManoa} alt="MANOA" style={{ height: 28 }} />
      <div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '.5px' }}>
          MANOA
        </span>
        <span style={{
          color: 'rgba(255,255,255,.72)', fontSize: '.68rem',
          letterSpacing: '2px', textTransform: 'uppercase', display: 'block',
        }}>
          Custom English
        </span>
      </div>
    </div>
  );
}

