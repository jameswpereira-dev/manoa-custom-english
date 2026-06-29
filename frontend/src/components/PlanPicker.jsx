import React from 'react';
import { useNavigate } from 'react-router-dom';
import Btn from './Btn';
import { PLAN_CATALOG } from '../config/plans';

const GREEN = '#16a34a';

const PLANS = PLAN_CATALOG.map(p => ({
  id:      p.tier,
  name:    p.tier,
  price:   p.price,
  words:   `${p.limit} palavras/mês`,
  popular: p.popular,
}));

const FEATURES = [
  'Vocabulário da sua área',
  'Exercícios com IA',
  'Áudio nativo',
  'Listening interativo',
];

export default function PlanPicker() {
  const nav = useNavigate();

  return (
    <div style={{ padding:'24px 0 8px' }}>
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <h2 style={{ color:'#3C5A99', fontSize:'1.5rem', fontWeight:700, marginBottom:8 }}>
          Escolha seu plano para começar
        </h2>
        <p style={{ color:'#64748b', fontSize:'.92rem', maxWidth:440, margin:'0 auto' }}>
          Sua conta está ativa! Agora escolha um plano para liberar o upload de documentos e a geração de exercícios.
        </p>
      </div>

      <div style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',
        gap:24, maxWidth:880, margin:'0 auto',
      }}>
        {PLANS.map(p => (
          <div key={p.id} style={{
            background: p.popular ? '#3C5A99' : '#fff',
            color: p.popular ? '#fff' : '#1e293b',
            borderRadius:16, padding:'32px 24px',
            boxShadow: p.popular ? '0 12px 32px rgba(60,90,153,.28)' : '0 2px 10px rgba(0,0,0,.06)',
            border: p.popular ? 'none' : '1.5px solid #e2e8f0',
            position:'relative', textAlign:'center',
          }}>
            {p.popular && (
              <div style={{
                position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)',
                background:'#f59e0b', color:'#fff', fontSize:'.7rem', fontWeight:700,
                padding:'4px 16px', borderRadius:20, whiteSpace:'nowrap',
              }}>
                ⭐ Mais popular
              </div>
            )}
            <div style={{ fontSize:'.82rem', fontWeight:700, marginBottom:6, color:p.popular?'#cbd5e1':'#64748b' }}>
              {p.name.toUpperCase()}
            </div>
            <div style={{ fontSize:'2.1rem', fontWeight:800, marginBottom:2 }}>{p.price}</div>
            <div style={{ fontSize:'.82rem', opacity:.75, marginBottom:18 }}>/mês · {p.words}</div>
            <ul style={{ listStyle:'none', padding:0, margin:'0 0 26px', textAlign:'left' }}>
              {FEATURES.map(f => (
                <li key={f} style={{ fontSize:'.86rem', marginBottom:8, display:'flex', gap:8 }}>
                  <span style={{ color:p.popular?'#93c5fd':'#3C5A99', fontWeight:700 }}>✓</span>
                  <span style={{ opacity:p.popular?.92:1 }}>{f}</span>
                </li>
              ))}
            </ul>
            <Btn
              fullWidth
              onClick={() => nav(`/checkout?plan=${p.id}`)}
              style={p.popular ? { background:'#fff', color:'#3C5A99' } : {}}
            >
              Assinar
            </Btn>
          </div>
        ))}

        {/* Pix one-time card */}
        <div style={{
          background: '#fff', color: '#1e293b',
          borderRadius: 16, padding: '32px 24px',
          boxShadow: '0 2px 10px rgba(0,0,0,.06)',
          border: '2px dashed #86efac',
          position: 'relative', textAlign: 'center',
        }}>
          <div style={{
            position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
            background: GREEN, color: '#fff', fontSize: '.7rem', fontWeight: 700,
            padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap',
          }}>
            Pague uma vez
          </div>
          <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: 6, color: '#64748b' }}>
            PACOTE AVULSO PIX
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: 2 }}>R$ 39,90</div>
          <div style={{ fontSize: '.82rem', opacity: .75, marginBottom: 18 }}>pagamento único · 30 dias</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px', textAlign: 'left' }}>
            {FEATURES.map(f => (
              <li key={f} style={{ fontSize: '.86rem', marginBottom: 8, display: 'flex', gap: 8 }}>
                <span style={{ color: GREEN, fontWeight: 700 }}>✓</span>
                <span>{f}</span>
              </li>
            ))}
            <li style={{ fontSize: '.86rem', marginBottom: 8, display: 'flex', gap: 8 }}>
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>○</span>
              <span style={{ color: '#94a3b8' }}>Sem renovação automática</span>
            </li>
          </ul>
          <Btn fullWidth onClick={() => nav('/pix-payment')} style={{ background: GREEN }}>
            Pagar com Pix
          </Btn>
        </div>
      </div>
    </div>
  );
}
