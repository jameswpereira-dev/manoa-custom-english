import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Btn    from '../components/Btn';
import { getWords } from '../services/api';

export default function Study() {
  const { wordId } = useParams();
  const [word, setWord]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
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
    if (audioRef.current) {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  if (loading) return <Layout><div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Carregando…</div></Layout>;
  if (!word)   return <Layout><div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Palavra não encontrada.</div></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <Link to="/dashboard" style={{ color:'#94a3b8', fontSize:'1.2rem' }}>←</Link>
          <h2 style={{ color:'#3C5A99', fontWeight:700 }}>Matéria</h2>
        </div>

        {/* Word card */}
        <div style={{ background:'#fff', borderRadius:14, padding:32, boxShadow:'0 4px 20px rgba(0,0,0,.08)', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
            <div>
              <h1 style={{ fontSize:'2.4rem', fontWeight:800, color:'#1e293b', marginBottom:6 }}>
                {word.palavra}
              </h1>
              {word.contexto && (
                <span style={{
                  background:'#eff6ff', color:'#3C5A99', fontSize:'.78rem',
                  fontWeight:500, padding:'3px 10px', borderRadius:20,
                }}>📎 {word.contexto}</span>
              )}
            </div>

            {word.audio_url && (
              <button onClick={playAudio}
                style={{
                  background: playing ? '#dcfce7' : '#eff6ff',
                  border:'none', borderRadius:50, width:54, height:54,
                  fontSize:'1.4rem', cursor:'pointer', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background .2s',
                }}>
                🔊
              </button>
            )}
          </div>

          {word.audio_url && (
            <audio ref={audioRef} src={word.audio_url} onEnded={()=>setPlaying(false)} />
          )}

          <div style={{ borderTop:'1px solid #f1f5f9', marginTop:20, paddingTop:20 }}>
            <h3 style={{ fontSize:'.78rem', fontWeight:600, color:'#94a3b8', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
              Definição em português
            </h3>
            <p style={{ color:'#1e293b', fontSize:'1.05rem', lineHeight:1.7 }}>
              {word.definicao_pt || '—'}
            </p>
          </div>

          <div style={{ borderTop:'1px solid #f1f5f9', marginTop:20, paddingTop:20 }}>
            <h3 style={{ fontSize:'.78rem', fontWeight:600, color:'#94a3b8', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
              Exemplo de uso
            </h3>
            <p style={{
              color:'#475569', fontSize:'1rem', lineHeight:1.7,
              background:'#f8fafc', padding:'14px 16px', borderRadius:8,
              borderLeft:'3px solid #3C5A99', fontStyle:'italic',
            }}>
              "{word.exemplo_uso || '—'}"
            </p>
          </div>
        </div>

        {/* Navigation */}
        <Link to={`/exercicios/${word.id}`}>
          <Btn fullWidth>✏️ Fazer exercícios</Btn>
        </Link>
      </div>
    </Layout>
  );
}
