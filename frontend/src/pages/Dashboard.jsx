import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Btn    from '../components/Btn';
import PlanPicker from '../components/PlanPicker';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getWords, deleteWord } from '../services/api';

export default function Dashboard() {
  const { user }              = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  const nav                   = useNavigate();
  const [words, setWords]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(new Set());

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await getWords();
      setWords(data.words || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remover esta palavra?')) return;
    setDeleting(id);
    try {
      await deleteWord(id);
      setWords(w => w.filter(x => x.id !== id));
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    } catch { alert('Erro ao remover.'); }
    setDeleting(null);
  };

  const toggleSelect = (id) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll  = () => setSelected(new Set(filtered.map(w => w.id)));
  const clearAll   = () => setSelected(new Set());

  const handleGenerateExercises = () => {
    nav('/exercicios-multiplos', { state: { wordIds: [...selected] } });
  };

  const filtered = words.filter(w =>
    w.palavra?.toLowerCase().includes(search.toLowerCase()) ||
    w.contexto?.toLowerCase().includes(search.toLowerCase())
  );

  const isSubscribed   = subscription && subscription.status === 'ativo';
  const isExpiredPix   = subscription?.status === 'expirado' && subscription?.payment_provider === 'mercadopago';

  if (subLoading) {
    return (
      <Layout>
        <div style={{ textAlign:'center', padding:80, color:'#94a3b8' }}>Carregando…</div>
      </Layout>
    );
  }

  if (!isSubscribed) {
    return (
      <Layout>
        {isExpiredPix ? <ExpiredPixScreen /> : <PlanPicker />}
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Subscription status bar */}
      {subscription && <SubscriptionBar sub={subscription} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ color:'#3C5A99', fontSize:'1.4rem', fontWeight:700 }}>
            Olá, {user?.displayName || 'Aluno'}! 👋
          </h2>
          <p style={{ color:'#64748b', fontSize:'.9rem' }}>
            {words.length} {words.length === 1 ? 'palavra cadastrada' : 'palavras cadastradas'}
          </p>
        </div>
        <Link to="/upload"><Btn>+ Adicionar palavras</Btn></Link>
      </div>

      {words.length > 0 && (
        <>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Buscar palavra ou contexto…"
            style={{
              width:'100%', padding:'10px 16px', marginBottom:14,
              border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:'.95rem',
              background:'#fff', outline:'none',
            }}
          />

          {/* Selection controls */}
          <div style={{
            display:'flex', alignItems:'center', gap:10, marginBottom:16,
            flexWrap:'wrap',
          }}>
            <button onClick={selectAll}
              style={{ background:'none', border:'1px solid #cbd5e1', borderRadius:6,
                padding:'5px 12px', fontSize:'.82rem', color:'#475569', cursor:'pointer' }}>
              Selecionar todas
            </button>
            <button onClick={clearAll}
              style={{ background:'none', border:'1px solid #cbd5e1', borderRadius:6,
                padding:'5px 12px', fontSize:'.82rem', color:'#475569', cursor:'pointer' }}>
              Limpar seleção
            </button>
            <Btn
              onClick={handleGenerateExercises}
              disabled={selected.size === 0}
              style={{ padding:'6px 16px', fontSize:'.85rem' }}
            >
              ✏️ Gerar Exercícios{selected.size > 0 ? ` (${selected.size})` : ''}
            </Btn>
          </div>
        </>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Carregando…</div>
      ) : words.length === 0 ? (
        <Empty onAdd={() => nav('/upload')} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Nenhuma palavra encontrada.</div>
      ) : (
        <div style={{ display:'grid', gap:14 }}>
          {filtered.map(w => (
            <WordCard
              key={w.id}
              word={w}
              onDelete={handleDelete}
              deleting={deleting}
              selected={selected.has(w.id)}
              onToggle={() => toggleSelect(w.id)}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}

function WordCard({ word, onDelete, deleting, selected, onToggle }) {
  const pct = word.progresso?.tentativas > 0
    ? Math.round((word.progresso.acertos / word.progresso.tentativas) * 100)
    : 0;
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#3C5A99';

  return (
    <div style={{
      background: selected ? '#eff6ff' : '#fff',
      borderRadius:12, padding:'18px 20px',
      boxShadow:'0 2px 8px rgba(0,0,0,.07)',
      display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
      border: selected ? '2px solid #3C5A99' : '2px solid transparent',
      transition:'all .15s',
    }}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        style={{ width:18, height:18, cursor:'pointer', accentColor:'#3C5A99', flexShrink:0 }}
      />

      {/* Progress ring */}
      <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
        <svg width="52" height="52" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="26" cy="26" r="21" fill="none" stroke="#e2e8f0" strokeWidth="4"/>
          <circle cx="26" cy="26" r="21" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${(pct/100)*132} 132`} strokeLinecap="round"/>
        </svg>
        <span style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          fontSize:'.7rem', fontWeight:700, color,
        }}>{pct}%</span>
      </div>

      {/* Info */}
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:'1.05rem', color:'#1e293b' }}>{word.palavra}</div>
        {word.contexto && (
          <div style={{ fontSize:'.8rem', color:'#94a3b8', marginTop:2 }}>📎 {word.contexto}</div>
        )}
        <div style={{ fontSize:'.82rem', color:'#64748b', marginTop:3 }}>
          {word.progresso?.tentativas || 0} tentativas · {word.progresso?.acertos || 0} acertos
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:8 }}>
        <Btn variant="ghost" loading={deleting===word.id}
          onClick={() => onDelete(word.id)}
          style={{ padding:'7px 10px', fontSize:'.82rem', color:'#ef4444' }}>
          🗑
        </Btn>
      </div>
    </div>
  );
}

function Empty({ onAdd }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:'3rem', marginBottom:12 }}>📚</div>
      <h3 style={{ color:'#3C5A99', marginBottom:8 }}>Nenhuma palavra ainda</h3>
      <p style={{ color:'#64748b', marginBottom:24, maxWidth:360, margin:'0 auto 24px' }}>
        Adicione suas primeiras palavras em inglês e comece a aprender com exercícios personalizados.
      </p>
      <Btn onClick={onAdd}>+ Adicionar minha primeira palavra</Btn>
    </div>
  );
}

function ExpiredPixScreen() {
  const nav = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏰</div>
      <h2 style={{ color: '#1E3A6A', fontSize: '1.4rem', fontWeight: 700, marginBottom: 10 }}>
        Seu acesso Pix expirou
      </h2>
      <p style={{ color: '#64748b', marginBottom: 28, lineHeight: 1.7 }}>
        Por R$ 39,90 você teve <strong>10 palavras por 30 dias</strong> — ótimo para começar.
      </p>
      <div style={{
        background: '#f0f9ff', border: '1.5px solid #bae6fd',
        borderRadius: 12, padding: '20px 24px', marginBottom: 32, textAlign: 'left',
      }}>
        <strong style={{ color: '#0369a1', fontSize: '.9rem' }}>Quer continuar aprendendo?</strong>
        <p style={{ color: '#475569', fontSize: '.88rem', margin: '8px 0 0', lineHeight: 1.7 }}>
          Com o plano <strong>Professional</strong> (R$ 39,90/mês) você tem{' '}
          <strong>15 palavras</strong> renovadas automaticamente todo mês — 50% mais vocabulário,
          sem precisar pagar de novo.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => nav('/pix-payment')}
          style={{
            background: '#fff', color: '#1E3A6A',
            border: '1.5px solid #1E3A6A', padding: '11px 22px',
            borderRadius: 8, fontSize: '.9rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Renovar Pix (10 palavras / 30 dias)
        </button>
        <button
          onClick={() => nav('/planos')}
          style={{
            background: '#1E3A6A', color: '#fff',
            border: 'none', padding: '11px 22px',
            borderRadius: 8, fontSize: '.9rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Ver planos com assinatura →
        </button>
      </div>
    </div>
  );
}

function SubscriptionBar({ sub }) {
  const disp  = sub.palavras_disponiveis ?? 0;
  // Use limite_palavras (new format) with fallback to plano if it's a number (old format)
  const total = sub.limite_palavras ?? (typeof sub.plano === 'number' ? sub.plano : 10);
  const tier  = typeof sub.plano === 'string' ? sub.plano : null;
  const used  = total - disp;
  const pct   = Math.min(100, Math.round((used / total) * 100));
  const color = disp === 0 ? '#ef4444' : disp <= total * 0.25 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{
      background: disp === 0 ? '#fef2f2' : '#f8fafc',
      border: `1px solid ${disp === 0 ? '#fecaca' : '#e2e8f0'}`,
      borderRadius: 10, padding: '12px 16px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#475569' }}>
            {tier ? `Plano ${tier}` : 'Plano'} —{' '}
            {sub.payment_provider === 'mercadopago' ? 'palavras restantes (30 dias)' : 'palavras restantes este mês'}
          </span>
          <span style={{ fontSize: '.82rem', fontWeight: 700, color }}>
            {disp}/{total}
          </span>
        </div>
        <div style={{ background: '#e2e8f0', borderRadius: 4, height: 5 }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 4,
            background: color, transition: 'width .4s',
          }} />
        </div>
      </div>
      {disp === 0 && (
        <span style={{ fontSize: '.82rem', color: '#ef4444', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Limite atingido — faça upgrade para continuar.
        </span>
      )}
    </div>
  );
}
