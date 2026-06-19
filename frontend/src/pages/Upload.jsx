import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Btn    from '../components/Btn';
import { useSubscription } from '../contexts/SubscriptionContext';
import { processContent, generateWords } from '../services/api';

const MODES = [
  { id:'A', label:'Inserir manualmente',     icon:'📝', desc:'Digite ou cole palavras em inglês' },
  { id:'B', label:'Gerar automaticamente',  icon:'✨', desc:'IA sugere vocabulário para sua profissão' },
];

const QTY_OPTIONS = [5, 10, 15, 20];

const TYPE_LABELS = {
  word:         { label:'Palavra',      bg:'#eff6ff', color:'#3C5A99' },
  expression:   { label:'Expressão',    bg:'#fef3c7', color:'#92400e' },
  phrasal_verb: { label:'Phrasal verb', bg:'#f0fdf4', color:'#166534' },
};

export default function Upload() {
  const nav = useNavigate();
  const { subscription } = useSubscription();
  const palavrasDisp = subscription?.palavras_disponiveis ?? 0;

  // Shared state
  const [mode,    setMode]    = useState('A');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [progress, setProgress] = useState('');

  // Mode A state
  const [words,   setWords]   = useState('');
  const [context, setContext] = useState('');

  // Mode B state
  const [profession,     setProfession]     = useState('');
  const [quantity,       setQuantity]       = useState(10);
  const [generatedItems, setGeneratedItems] = useState(null); // null = step 1, array = step 2
  const [selectedItems,  setSelectedItems]  = useState(new Set());
  const [generating,     setGenerating]     = useState(false);

  // ── Mode A: normal submit ─────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    setProgress('Enviando conteúdo…');
    try {
      const list = words.split(/[\n,]+/).map(w => w.trim()).filter(Boolean);
      if (!list.length) throw new Error('Digite pelo menos uma palavra.');
      setProgress('Gerando conteúdo com IA… (pode levar até 2 min)');
      await processContent({ mode: 'A', words: list, context });
      setProgress('');
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao processar.');
      setProgress('');
    } finally { setLoading(false); }
  };

  // ── Mode B step 1: generate preview ──────────────────────────────────────

  const handleGenerate = async () => {
    if (!profession.trim()) { setError('Informe sua profissão ou área.'); return; }
    setError(''); setGenerating(true);
    try {
      const data = await generateWords(profession.trim(), quantity);
      const items = data.items || [];
      setGeneratedItems(items);
      setSelectedItems(new Set(items.map((_, i) => i))); // select all by default
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao gerar sugestões.');
    } finally { setGenerating(false); }
  };

  const toggleItem = (i) => {
    setSelectedItems(s => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  // ── Mode B step 2: add selected ───────────────────────────────────────────

  const handleAddSelected = async () => {
    const picked = (generatedItems || []).filter((_, i) => selectedItems.has(i)).map(it => it.term);
    if (!picked.length) { setError('Selecione pelo menos um item.'); return; }
    setError(''); setLoading(true);
    setProgress('Gerando conteúdo com IA… (pode levar até 2 min)');
    try {
      await processContent({ mode: 'A', words: picked, context: profession });
      setProgress('');
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao processar.');
      setProgress('');
    } finally { setLoading(false); }
  };

  // ── Mode switch: reset B state ────────────────────────────────────────────

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setGeneratedItems(null);
    setSelectedItems(new Set());
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <h2 style={{ color:'#3C5A99', marginBottom:6 }}>Adicionar palavras</h2>
        <p style={{ color:'#64748b', marginBottom:24, fontSize:'.9rem' }}>
          Escolha o modo de entrada e adicione o vocabulário que você quer aprender.
        </p>

        {/* Mode selector */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:28 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => switchMode(m.id)}
              style={{
                background: mode===m.id ? '#3C5A99' : '#fff',
                color:      mode===m.id ? '#fff'     : '#475569',
                border:     `2px solid ${mode===m.id ? '#3C5A99' : '#e2e8f0'}`,
                borderRadius:10, padding:'14px 10px', cursor:'pointer',
                textAlign:'center', transition:'all .15s',
              }}>
              <div style={{ fontSize:'1.5rem' }}>{m.icon}</div>
              <div style={{ fontWeight:600, fontSize:'.82rem', marginTop:4 }}>{m.label}</div>
              <div style={{ fontSize:'.72rem', opacity:.75, marginTop:2 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* ── Mode B: Gerar automaticamente ─────────────────────────────── */}
        {mode === 'B' && !generatedItems && (
          <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.07)' }}>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Qual é a sua profissão ou área?</label>
              <input
                value={profession}
                onChange={e => setProfession(e.target.value)}
                placeholder="ex: TI, Direito, Medicina, Engenharia, Contabilidade…"
                style={inputStyle}
                onKeyDown={e => { if (e.key === 'Enter' && !generating) handleGenerate(); }}
              />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={labelStyle}>Quantas palavras/expressões gerar?</label>
              <div style={{ display:'flex', gap:10 }}>
                {QTY_OPTIONS.map(q => (
                  <button key={q} onClick={() => setQuantity(q)}
                    style={{
                      flex:1, padding:'10px 0', borderRadius:8, cursor:'pointer',
                      fontWeight: quantity === q ? 700 : 400,
                      fontSize:'.95rem',
                      background: quantity === q ? '#3C5A99' : '#f8fafc',
                      color:      quantity === q ? '#fff'     : '#475569',
                      border:     `1.5px solid ${quantity === q ? '#3C5A99' : '#e2e8f0'}`,
                      transition:'all .15s',
                    }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {error && <ErrorBox msg={error} />}

            <div style={{ display:'flex', gap:10 }}>
              <Btn type="button" variant="outline" onClick={() => nav('/dashboard')}>Cancelar</Btn>
              <Btn type="button" loading={generating} onClick={handleGenerate} style={{ flex:1 }}>
                {generating ? 'Gerando…' : '✨ Gerar'}
              </Btn>
            </div>
          </div>
        )}

        {/* ── Mode B step 2: results list ───────────────────────────────── */}
        {mode === 'B' && generatedItems && (
          <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
              <div>
                <h3 style={{ color:'#1e293b', fontWeight:700, fontSize:'1rem', margin:0 }}>
                  {generatedItems.length} sugestões para "{profession}"
                </h3>
                <p style={{ color:'#94a3b8', fontSize:'.8rem', marginTop:2 }}>
                  Desmarque os itens que não quer e clique em Adicionar.
                </p>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setSelectedItems(new Set(generatedItems.map((_,i)=>i)))}
                  style={{ background:'none', border:'1px solid #cbd5e1', borderRadius:6,
                    padding:'4px 10px', fontSize:'.78rem', color:'#475569', cursor:'pointer' }}>
                  Selecionar todas
                </button>
                <button onClick={() => setSelectedItems(new Set())}
                  style={{ background:'none', border:'1px solid #cbd5e1', borderRadius:6,
                    padding:'4px 10px', fontSize:'.78rem', color:'#475569', cursor:'pointer' }}>
                  Limpar
                </button>
              </div>
            </div>

            <div style={{ display:'grid', gap:8, maxHeight:360, overflowY:'auto', marginBottom:16 }}>
              {generatedItems.map((item, i) => {
                const sel = selectedItems.has(i);
                const tl  = TYPE_LABELS[item.type] || TYPE_LABELS.word;
                return (
                  <label key={i}
                    style={{
                      display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px',
                      borderRadius:8, cursor:'pointer',
                      background: sel ? '#eff6ff' : '#f8fafc',
                      border:`1.5px solid ${sel ? '#3C5A99' : '#e2e8f0'}`,
                      transition:'all .15s',
                    }}>
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => toggleItem(i)}
                      style={{ marginTop:2, width:16, height:16, accentColor:'#3C5A99', flexShrink:0 }}
                    />
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:600, color:'#1e293b', fontSize:'.95rem' }}>
                          {item.term}
                        </span>
                        <span style={{
                          background: tl.bg, color: tl.color,
                          fontSize:'.7rem', fontWeight:600, padding:'2px 7px', borderRadius:12,
                        }}>
                          {tl.label}
                        </span>
                      </div>
                      {item.preview && (
                        <p style={{ color:'#64748b', fontSize:'.82rem', marginTop:3 }}>
                          {item.preview}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {error && <ErrorBox msg={error} />}

            {progress && <ProgressBox msg={progress} />}

            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="outline" onClick={() => { setGeneratedItems(null); setError(''); }}>
                ← Voltar
              </Btn>
              <Btn
                loading={loading}
                disabled={selectedItems.size === 0}
                onClick={handleAddSelected}
                style={{ flex:1 }}
              >
                {loading ? 'Processando…' : `🚀 Adicionar selecionados (${selectedItems.size})`}
              </Btn>
            </div>
          </div>
        )}

        {/* ── Mode A ────────────────────────────────────────────────────── */}
        {mode === 'A' && (
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Palavras em inglês</label>
              <textarea
                value={words} onChange={e => setWords(e.target.value)}
                placeholder={'litigation\ncontract\nclause\njurisdiction'}
                rows={5} required
                style={textareaStyle}
              />
              <p style={{ color:'#94a3b8', fontSize:'.78rem', marginTop:4 }}>
                Separe por Enter ou vírgula
              </p>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Contexto profissional (opcional)</label>
              <input
                value={context} onChange={e => setContext(e.target.value)}
                placeholder="ex: contratos jurídicos, medicina, TI, negócios…"
                style={inputStyle}
              />
            </div>
            {(() => {
              const wordCount = words.split(/[\n,]+/).map(w=>w.trim()).filter(Boolean).length;
              if (wordCount > 0 && wordCount > palavrasDisp) {
                return <ErrorBox msg={`Você tem ${palavrasDisp} palavra${palavrasDisp!==1?'s':''} disponível${palavrasDisp!==1?'is':''} este mês. Serão processadas apenas as primeiras ${palavrasDisp}.`} />;
              }
              return null;
            })()}
            {error    && <ErrorBox msg={error} />}
            {progress && <ProgressBox msg={progress} />}
            <div style={{ display:'flex', gap:10 }}>
              <Btn type="button" variant="outline" onClick={() => nav('/dashboard')}>Cancelar</Btn>
              <Btn type="submit" loading={loading} disabled={palavrasDisp === 0} style={{ flex:1 }}>
                {loading ? 'Processando…' : '🚀 Processar e salvar'}
              </Btn>
            </div>
            {palavrasDisp === 0 && (
              <p style={{ color:'#ef4444', fontSize:'.83rem', marginTop:8, textAlign:'center' }}>
                Você atingiu o limite do seu plano. Faça upgrade para continuar.
              </p>
            )}
          </form>
        )}

      </div>
    </Layout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ErrorBox({ msg }) {
  return (
    <div style={{
      background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8,
      padding:'10px 14px', color:'#dc2626', fontSize:'.85rem', marginBottom:14,
    }}>{msg}</div>
  );
}

function ProgressBox({ msg }) {
  return (
    <div style={{
      background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8,
      padding:'10px 14px', color:'#3C5A99', fontSize:'.85rem', marginBottom:14,
      display:'flex', alignItems:'center', gap:10,
    }}>
      <Spinner /> {msg}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const formStyle = {
  background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.07)',
};

const labelStyle = {
  display:'block', fontSize:'.85rem', fontWeight:500, color:'#475569', marginBottom:5,
};

const textareaStyle = {
  width:'100%', padding:'10px 14px', border:'1.5px solid #cbd5e1',
  borderRadius:8, fontSize:'0.95rem', outline:'none', resize:'vertical', fontFamily:'inherit',
};

const inputStyle = {
  width:'100%', padding:'10px 14px', border:'1.5px solid #cbd5e1',
  borderRadius:8, fontSize:'0.95rem', outline:'none', fontFamily:'inherit',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span style={{
      width:14, height:14, border:'2px solid #bfdbfe', borderTop:'2px solid #3C5A99',
      borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite', flexShrink:0,
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}
