import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Btn    from '../components/Btn';
import { getWords, updateProgress } from '../services/api';

export default function Dictation() {
  const { wordId } = useParams();
  const [word,    setWord]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [input,   setInput]   = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    getWords().then(({ words }) => {
      const w = (words || []).find(x => x.id === wordId);
      setWord(w || null);
      setLoading(false);
    });
  }, [wordId]);

  const playAudio = () => {
    if (!word?.audio_url) return;
    audioRef.current?.play();
    setPlaying(true);
  };

  const check = async () => {
    const ans = input.trim().toLowerCase();
    const isCorrect = ans === word.palavra.trim().toLowerCase();
    setChecked(true);
    setCorrect(isCorrect);
    setAttempts(a => a + 1);
    try { await updateProgress(word.id, isCorrect); } catch {}
  };

  const retry = () => {
    setChecked(false);
    setInput('');
  };

  if (loading) return <Layout><p style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Carregando…</p></Layout>;
  if (!word)   return <Layout><p style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Palavra não encontrada.</p></Layout>;

  const ditadoEx = (word.exercicios || []).find(e => e.tipo === 'ditado');

  return (
    <Layout>
      <div style={{ maxWidth:520, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <Link to={`/exercicios/${word.id}`} style={{ color:'#94a3b8', fontSize:'1.2rem' }}>←</Link>
          <h2 style={{ color:'#B22234', fontWeight:700 }}>🎧 Ouvir — <em>{word.palavra}</em></h2>
        </div>

        <div style={{ background:'#fff', borderRadius:14, padding:32, boxShadow:'0 4px 20px rgba(0,0,0,.08)', textAlign:'center' }}>
          <p style={{ color:'#475569', marginBottom:24, fontSize:'1rem' }}>
            Ouça o áudio e escreva a palavra que você escutar.
          </p>

          {/* Audio player button */}
          <button onClick={playAudio}
            style={{
              background: playing ? '#dcfce7' : '#fef2f2',
              border: `3px solid ${playing ? '#22c55e' : '#B22234'}`,
              borderRadius: 80, width:80, height:80,
              fontSize:'2rem', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px',
              transition:'all .2s', boxShadow:'0 4px 16px rgba(178,34,52,.15)',
            }}>
            {playing ? '🔊' : '▶️'}
          </button>

          {word.audio_url ? (
            <audio ref={audioRef} src={word.audio_url} onEnded={()=>setPlaying(false)} />
          ) : (
            <p style={{ color:'#94a3b8', fontSize:'.85rem', marginBottom:20 }}>
              Áudio não disponível para esta palavra.
            </p>
          )}

          {ditadoEx?.enunciado && (
            <p style={{ color:'#64748b', fontSize:'.9rem', marginBottom:20, fontStyle:'italic' }}>
              {ditadoEx.enunciado}
            </p>
          )}

          {/* Input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite a palavra que ouviu…"
            disabled={checked}
            style={{
              width:'100%', padding:'13px 16px', textAlign:'center',
              fontSize:'1.1rem', fontWeight:500,
              border:`2px solid ${checked ? (correct ? '#22c55e' : '#ef4444') : '#cbd5e1'}`,
              borderRadius:10, outline:'none',
              background: checked ? (correct ? '#dcfce7' : '#fef2f2') : '#fff',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !checked && input) check(); }}
          />

          {/* Feedback */}
          {checked && (
            <div style={{ marginTop:20 }}>
              {correct ? (
                <div style={{ color:'#166534', fontWeight:600, fontSize:'1.1rem', marginBottom:8 }}>
                  ✅ Perfeito! Você acertou!
                </div>
              ) : (
                <div>
                  <div style={{ color:'#991b1b', fontWeight:600, fontSize:'1.05rem', marginBottom:4 }}>
                    ❌ Não foi dessa vez.
                  </div>
                  <div style={{ color:'#475569', fontSize:'.9rem' }}>
                    A resposta correta era: <strong style={{ color:'#3C5A99' }}>{word.palavra}</strong>
                  </div>
                </div>
              )}
              <div style={{ color:'#94a3b8', fontSize:'.8rem', marginTop:6 }}>
                {attempts} tentativa{attempts !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop:24, display:'flex', gap:10, justifyContent:'center' }}>
            {!checked ? (
              <>
                <Btn variant="outline" onClick={playAudio}>🔊 Ouvir novamente</Btn>
                <Btn variant="red" onClick={check} disabled={!input}>Verificar</Btn>
              </>
            ) : (
              <>
                <Btn variant="outline" onClick={retry}>Tentar novamente</Btn>
                <Link to="/dashboard">
                  <Btn>← Voltar ao painel</Btn>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
