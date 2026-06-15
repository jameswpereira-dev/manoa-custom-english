import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Btn    from '../components/Btn';
import { getWords, updateProgress } from '../services/api';

function normalizeEx(ex) {
  if (ex.type) return ex;
  const typeMap = { lacuna: 'fill_in_the_blank', multipla_escolha: 'multiple_choice' };
  return {
    type:    typeMap[ex.tipo] || null,
    question: ex.enunciado,
    answer:   ex.resposta,
    options:  ex.opcoes,
  };
}

function shuffleOptions(ex) {
  if (['multiple_choice', 'definition_match'].includes(ex.type) && ex.options?.length) {
    return { ...ex, options: [...ex.options].sort(() => Math.random() - 0.5) };
  }
  return ex;
}

const FALLBACK_WORDS = ['develop', 'analyze', 'implement', 'optimize', 'configure', 'execute', 'validate', 'deploy'];

function makeListeningExercise(word, allWords) {
  const distractors = allWords
    .filter(w => w.id !== word.id && w.palavra)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.palavra);

  let fi = 0;
  while (distractors.length < 3) {
    const fb = FALLBACK_WORDS[fi++ % FALLBACK_WORDS.length];
    if (!distractors.includes(fb) && fb !== word.palavra) distractors.push(fb);
  }

  const options = [word.palavra, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
  return {
    type: 'listening',
    question: 'Ouça o áudio e identifique qual palavra ou expressão foi pronunciada.',
    options,
    answer: word.palavra,
    audio_url: word.audio_url,
  };
}

function checkAnswer(ex, userAnswer, vocabWord) {
  const given = (userAnswer || '').trim().toLowerCase();
  if (ex.type === 'sentence_building') {
    return given.length > 2 && given.includes((vocabWord || '').toLowerCase());
  }
  return given === (ex.answer || '').trim().toLowerCase();
}

const TYPE_LABEL = {
  fill_in_the_blank: 'PREENCHER LACUNA',
  multiple_choice:   'MÚLTIPLA ESCOLHA',
  true_or_false:     'VERDADEIRO OU FALSO',
  sentence_building: 'CONSTRUIR FRASE',
  definition_match:  'DEFINIÇÃO CORRETA',
  listening:         'OUÇA E RESPONDA',
};

const TYPE_COLOR = {
  fill_in_the_blank: { bg:'#eff6ff', color:'#3C5A99' },
  multiple_choice:   { bg:'#fef3c7', color:'#92400e' },
  true_or_false:     { bg:'#f0fdf4', color:'#166534' },
  sentence_building: { bg:'#fdf4ff', color:'#7e22ce' },
  definition_match:  { bg:'#fff7ed', color:'#c2410c' },
  listening:         { bg:'#fff1f2', color:'#9f1239' },
};

export default function Exercises() {
  const { wordId } = useParams();
  const [word,      setWord]      = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [step,      setStep]      = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [checked,   setChecked]   = useState({});
  const [input,     setInput]     = useState('');
  const [done,      setDone]      = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    getWords().then(({ words }) => {
      const all = words || [];
      const w   = all.find(x => x.id === wordId);
      setWord(w || null);
      if (w) {
        const existing = (w.exercicios || [])
          .map(normalizeEx)
          .filter(e => e.type && e.type !== 'ditado')
          .map(shuffleOptions);
        const listening = makeListeningExercise(w, all);
        setExercises([...existing, listening]);
      }
      setLoading(false);
    });
  }, [wordId]);

  // Auto-play audio when a listening exercise appears
  useEffect(() => {
    const ex = exercises[step];
    if (ex?.type === 'listening' && ex.audio_url) {
      setTimeout(() => { audioRef.current?.play().catch(() => {}); }, 350);
    }
  }, [step, exercises]);

  if (loading) return <Layout><p style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Carregando…</p></Layout>;
  if (!word)   return <Layout><p style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Palavra não encontrada.</p></Layout>;

  if (!exercises.length) return (
    <Layout>
      <div style={{ textAlign:'center', padding:60 }}>
        <p style={{ color:'#94a3b8' }}>Nenhum exercício disponível para esta palavra.</p>
        <Link to="/dashboard"><Btn style={{ marginTop:16 }}>Voltar</Btn></Link>
      </div>
    </Layout>
  );

  const ex        = exercises[step];
  const isChecked = checked[step] !== undefined;
  const isCorrect = checked[step];
  const colors    = TYPE_COLOR[ex.type] || { bg:'#f8fafc', color:'#64748b' };

  const check = async () => {
    const ans = answers[step];
    if (!ans) return;
    const correct = checkAnswer(ex, ans, word.palavra);
    setChecked(c => ({ ...c, [step]: correct }));
    try { await updateProgress(word.id, correct); } catch {}
  };

  const next = () => {
    if (step + 1 >= exercises.length) { setDone(true); return; }
    setStep(s => s + 1);
    setInput('');
  };

  const totalCorrect = Object.values(checked).filter(Boolean).length;

  if (done) {
    return (
      <Layout>
        <div style={{ maxWidth:500, margin:'0 auto', textAlign:'center', padding:'40px 20px' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>
            {totalCorrect === exercises.length ? '🏆' : totalCorrect >= exercises.length / 2 ? '👍' : '📚'}
          </div>
          <h2 style={{ color:'#3C5A99', marginBottom:8 }}>Exercícios concluídos!</h2>
          <p style={{ color:'#475569', marginBottom:24 }}>
            Você acertou <strong>{totalCorrect}</strong> de <strong>{exercises.length}</strong> exercícios.
          </p>
          <Link to="/dashboard">
            <Btn fullWidth>← Voltar ao painel</Btn>
          </Link>
        </div>
      </Layout>
    );
  }

  const renderInput = () => {
    // Listening: audio + multiple choice
    if (ex.type === 'listening') {
      return (
        <div>
          {ex.audio_url && (
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <button
                onClick={() => audioRef.current?.play()}
                style={{
                  background:'#fff1f2', border:'3px solid #9f1239',
                  borderRadius:60, width:68, height:68, fontSize:'1.8rem',
                  cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 4px 14px rgba(159,18,57,.15)',
                }}
              >
                🔊
              </button>
              <p style={{ color:'#64748b', fontSize:'.82rem', marginTop:6, maxWidth:320, textAlign:'center', lineHeight:1.5 }}>
                Repita em voz alta enquanto escuta. Repita quantas vezes for necessário para aprender a pronúncia correta.
              </p>
              <audio key={ex.audio_url} ref={audioRef} src={ex.audio_url} />
            </div>
          )}
          <div style={{ display:'grid', gap:8 }}>
            {(ex.options || []).map((op, oi) => {
              const sel     = answers[step] === op;
              const correct = isChecked && op.toLowerCase() === (ex.answer || '').toLowerCase();
              const wrong   = isChecked && sel && !correct;
              return (
                <button key={oi} onClick={() => !isChecked && setAnswers(a => ({ ...a, [step]: op }))}
                  style={{
                    padding:'11px 16px', borderRadius:8, textAlign:'left',
                    fontSize:'0.95rem', cursor: isChecked ? 'default' : 'pointer',
                    background: correct ? '#dcfce7' : wrong ? '#fef2f2' : sel ? '#fff1f2' : '#f8fafc',
                    border:`1.5px solid ${correct ? '#22c55e' : wrong ? '#ef4444' : sel ? '#9f1239' : '#e2e8f0'}`,
                    fontWeight: sel ? 500 : 400, transition:'all .15s',
                  }}>
                  {correct && '✅ '}{wrong && '❌ '}{op}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (ex.type === 'true_or_false') {
      return (
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          {['true', 'false'].map(opt => {
            const selected = answers[step] === opt;
            const correct  = isChecked && opt === (ex.answer || '').toLowerCase();
            const wrong    = isChecked && selected && !correct;
            return (
              <button key={opt} onClick={() => !isChecked && setAnswers(a => ({ ...a, [step]: opt }))}
                style={{
                  padding:'12px 32px', borderRadius:10, fontSize:'1rem', fontWeight:600,
                  cursor: isChecked ? 'default' : 'pointer',
                  background: correct ? '#dcfce7' : wrong ? '#fef2f2' : selected ? '#eff6ff' : '#f8fafc',
                  border:`2px solid ${correct ? '#22c55e' : wrong ? '#ef4444' : selected ? '#3C5A99' : '#e2e8f0'}`,
                  transition:'all .15s',
                }}>
                {correct && '✅ '}{wrong && '❌ '}{opt === 'true' ? 'True' : 'False'}
              </button>
            );
          })}
        </div>
      );
    }

    if (ex.type === 'multiple_choice' || ex.type === 'definition_match') {
      return (
        <div style={{ display:'grid', gap:8 }}>
          {(ex.options || []).map((op, oi) => {
            const selected = answers[step] === op;
            const correct  = isChecked && op === ex.answer;
            const wrong    = isChecked && selected && !correct;
            return (
              <button key={oi} onClick={() => !isChecked && setAnswers(a => ({ ...a, [step]: op }))}
                style={{
                  padding:'11px 16px', borderRadius:8, textAlign:'left',
                  fontSize:'0.95rem', cursor: isChecked ? 'default' : 'pointer',
                  background: correct ? '#dcfce7' : wrong ? '#fef2f2' : selected ? '#eff6ff' : '#f8fafc',
                  border:`1.5px solid ${correct ? '#22c55e' : wrong ? '#ef4444' : selected ? '#3C5A99' : '#e2e8f0'}`,
                  fontWeight: selected ? 500 : 400, transition:'all .15s',
                }}>
                {correct && '✅ '}{wrong && '❌ '}{op}
              </button>
            );
          })}
        </div>
      );
    }

    // fill_in_the_blank and sentence_building: text input
    return (
      <input
        value={input}
        onChange={e => { setInput(e.target.value); setAnswers(a => ({ ...a, [step]: e.target.value })); }}
        placeholder={ex.type === 'sentence_building' ? 'Escreva uma frase com a palavra…' : 'Digite sua resposta…'}
        disabled={isChecked}
        style={{
          width:'100%', padding:'11px 14px',
          border:`1.5px solid ${isChecked ? (isCorrect ? '#22c55e' : '#ef4444') : '#cbd5e1'}`,
          borderRadius:8, fontSize:'1rem', outline:'none',
        }}
        onKeyDown={e => { if (e.key === 'Enter' && !isChecked) check(); }}
      />
    );
  };

  const renderFeedback = () => {
    if (!isChecked) return null;
    if (ex.type === 'sentence_building') {
      return isCorrect
        ? `✅ Boa frase! Exemplo: "${ex.answer}"`
        : `❌ Use a palavra "${word.palavra}" na frase. Exemplo: "${ex.answer}"`;
    }
    return isCorrect ? '✅ Correto!' : `❌ A resposta correta era: "${ex.answer}"`;
  };

  return (
    <Layout>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <Link to={`/estudo/${word.id}`} style={{ color:'#94a3b8', fontSize:'1.2rem' }}>←</Link>
          <div>
            <h2 style={{ color:'#3C5A99', fontWeight:700 }}>Exercícios — <em>{word.palavra}</em></h2>
            <div style={{ display:'flex', gap:4, marginTop:4 }}>
              {exercises.map((_, i) => (
                <div key={i} style={{
                  width:28, height:5, borderRadius:3,
                  background: checked[i] !== undefined
                    ? (checked[i] ? '#22c55e' : '#ef4444')
                    : i === step ? '#3C5A99' : '#e2e8f0',
                }}/>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background:'#fff', borderRadius:14, padding:28, boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
          <span style={{
            background: colors.bg, color: colors.color,
            fontSize:'.75rem', fontWeight:600, padding:'3px 10px', borderRadius:20, letterSpacing:.5,
          }}>
            {TYPE_LABEL[ex.type] || ex.type.toUpperCase().replace(/_/g,' ')}
          </span>

          <p style={{ fontSize:'1.1rem', color:'#1e293b', margin:'16px 0 20px', lineHeight:1.7 }}>
            {ex.question}
          </p>

          {renderInput()}

          {isChecked && (
            <div style={{
              marginTop:16, padding:'12px 16px', borderRadius:8,
              background: isCorrect ? '#dcfce7' : '#fef2f2',
              color: isCorrect ? '#166534' : '#991b1b',
              fontWeight:500,
            }}>
              {renderFeedback()}
            </div>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16 }}>
          <span style={{ color:'#94a3b8', fontSize:'.85rem' }}>
            {step + 1} / {exercises.length}
          </span>
          <div style={{ display:'flex', gap:10 }}>
            {!isChecked ? (
              <Btn onClick={check} disabled={!answers[step]}>Verificar</Btn>
            ) : (
              <Btn onClick={next}>
                {step + 1 >= exercises.length ? 'Ver resultado' : 'Próximo →'}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
