import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Btn    from '../components/Btn';
import { getWords, updateProgress, evaluateScenario } from '../services/api';
import { useSoundEffects } from '../hooks/useSoundEffects';

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeEx(ex) {
  if (ex.type) return ex;
  const typeMap = { lacuna: 'fill_in_the_blank', multipla_escolha: 'multiple_choice' };
  return {
    type:     typeMap[ex.tipo] || null,
    question: ex.enunciado,
    answer:   ex.resposta,
    options:  ex.opcoes,
  };
}

function shuffleOptions(ex) {
  if (['multiple_choice', 'definition_match', 'listening'].includes(ex.type) && ex.options?.length) {
    return { ...ex, options: [...ex.options].sort(() => Math.random() - 0.5) };
  }
  return ex;
}

function makePronunciationIntro(word) {
  return {
    type: 'pronunciation_intro',
    question: 'Palavra nova! Ouça a pronúncia antes de começar os exercícios.',
    _word: word,
  };
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

function buildExerciseSets(selectedWords, allWords) {
  return selectedWords.map(word => {
    const existing = (word.exercicios || [])
      .map(normalizeEx)
      .filter(e => e.type && e.type !== 'ditado')
      .map(shuffleOptions);

    const listening = makeListeningExercise(word, allWords);

    // Merge and cap at 7 (6 backend exercises + 1 listening)
    const all = [...existing, listening].slice(0, 7);

    // Fixed ordering rule:
    //   pos 1 — pronunciation_intro (prepended below for new words)
    //   pos 2 — fill_in_the_blank (always first among scorable exercises)
    //   pos 3+ — all other types, reshuffled every session
    const fillBlank     = all.filter(e => e.type === 'fill_in_the_blank');
    const rest          = all.filter(e => e.type !== 'fill_in_the_blank');
    const shuffledRest  = rest.sort(() => Math.random() - 0.5);
    // Fallback: if fill_in_the_blank is absent, shuffledRest becomes positions 2+
    const ordered = [...fillBlank, ...shuffledRest].map(ex => ({ ...ex, _word: word }));

    // For new words (no prior attempts), prepend a pronunciation intro step
    if ((word.progresso?.tentativas ?? 0) === 0 && word.audio_url) {
      return [makePronunciationIntro(word), ...ordered];
    }

    return ordered;
  });
}

function interleave(sets) {
  if (!sets.length) return [];
  const maxLen = Math.max(...sets.map(s => s.length));
  const result = [];
  for (let i = 0; i < maxLen; i++) {
    for (const set of sets) {
      if (i < set.length) result.push(set[i]);
    }
  }
  return result;
}

function checkAnswer(ex, userAnswer) {
  const given = (userAnswer || '').trim().toLowerCase();
  if (ex.type === 'sentence_building') {
    return given.length > 2 && given.includes((ex._word?.palavra || '').toLowerCase());
  }
  return given === (ex.answer || '').trim().toLowerCase();
}

// ── Labels / colors ───────────────────────────────────────────────────────────

const TYPE_LABEL = {
  pronunciation_intro: 'NOVA PALAVRA — OUÇA',
  fill_in_the_blank:   'PREENCHER LACUNA',
  multiple_choice:     'MÚLTIPLA ESCOLHA',
  true_or_false:       'VERDADEIRO OU FALSO',
  sentence_building:   'CONSTRUIR FRASE',
  definition_match:    'DEFINIÇÃO CORRETA',
  listening:           'OUÇA E RESPONDA',
  scenario_production: 'CENÁRIO PROFISSIONAL',
};

const TYPE_COLOR = {
  pronunciation_intro: { bg:'#f0fdf4', color:'#166534' },
  fill_in_the_blank:   { bg:'#eff6ff', color:'#3C5A99' },
  multiple_choice:     { bg:'#fef3c7', color:'#92400e' },
  true_or_false:       { bg:'#f0fdf4', color:'#166534' },
  sentence_building:   { bg:'#fdf4ff', color:'#7e22ce' },
  definition_match:    { bg:'#fff7ed', color:'#c2410c' },
  listening:           { bg:'#fff1f2', color:'#9f1239' },
  scenario_production: { bg:'#ecfdf5', color:'#047857' },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MultiExercises() {
  const location = useLocation();
  const nav      = useNavigate();
  const wordIds  = location.state?.wordIds || [];

  const [exercises, setExercises] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [step,      setStep]      = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [checked,   setChecked]   = useState({});
  const [input,     setInput]     = useState('');
  const [done,      setDone]      = useState(false);
  const [evaluations, setEvaluations] = useState({});
  const [evaluating,  setEvaluating]  = useState(false);
  const audioRef = useRef(null);
  const { playSuccess, playFailure, muted, toggleMute, warmup } = useSoundEffects();

  useEffect(() => {
    if (!wordIds.length) { nav('/dashboard'); return; }

    getWords().then(({ words: all }) => {
      const allWords    = all || [];
      const selected    = allWords.filter(w => wordIds.includes(w.id));
      if (!selected.length) { nav('/dashboard'); return; }

      const sets        = buildExerciseSets(selected, allWords);
      const interleaved = interleave(sets);
      setExercises(interleaved);
      setLoading(false);
    }).catch(() => nav('/dashboard'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-play for listening and pronunciation intro steps
  useEffect(() => {
    const ex = exercises[step];
    if ((ex?.type === 'listening' || ex?.type === 'pronunciation_intro') && ex._word?.audio_url) {
      setTimeout(() => { audioRef.current?.play().catch(() => {}); }, 350);
    }
  }, [step, exercises]);

  if (loading) return (
    <Layout>
      <p style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Preparando exercícios…</p>
    </Layout>
  );

  if (!exercises.length) return (
    <Layout>
      <div style={{ textAlign:'center', padding:60 }}>
        <p style={{ color:'#94a3b8' }}>Nenhum exercício disponível para as palavras selecionadas.</p>
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

    // Unlock AudioContext synchronously within the user gesture, before any awaits.
    // Once unlocked here, it stays running — safe to play even after async gaps.
    warmup();

    if (ex.type === 'scenario_production') {
      setEvaluating(true);
      try {
        const result = await evaluateScenario(ex._word?.palavra, ex.question, ans);
        setEvaluations(e => ({ ...e, [step]: result }));
        const correto = !!result.correto;
        setChecked(c => ({ ...c, [step]: correto }));
        if (correto) playSuccess(); else playFailure();
        try { await updateProgress(ex._word.id, correto); } catch {}
      } catch {
        setEvaluations(e => ({ ...e, [step]: {
          correto: false, feedback: 'Não foi possível avaliar sua resposta agora. Tente novamente.', sugestao: null,
        } }));
        setChecked(c => ({ ...c, [step]: false }));
        playFailure();
      } finally {
        setEvaluating(false);
      }
      return;
    }

    const correct = checkAnswer(ex, ans);
    setChecked(c => ({ ...c, [step]: correct }));
    if (correct) playSuccess(); else playFailure();
    try { await updateProgress(ex._word.id, correct); } catch {}
  };

  const next = () => {
    if (step + 1 >= exercises.length) { setDone(true); return; }
    setStep(s => s + 1);
    setInput('');
  };

  const totalCorrect = Object.values(checked).filter(Boolean).length;
  const scorable = exercises.filter(e => e.type !== 'pronunciation_intro');

  if (done) {
    const pct = scorable.length > 0 ? Math.round((totalCorrect / scorable.length) * 100) : 0;
    return (
      <Layout>
        <div style={{ maxWidth:500, margin:'0 auto', textAlign:'center', padding:'40px 20px' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>
            {pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚'}
          </div>
          <h2 style={{ color:'#3C5A99', marginBottom:8 }}>Sessão concluída!</h2>
          <p style={{ color:'#475569', marginBottom:4 }}>
            Você acertou <strong>{totalCorrect}</strong> de <strong>{scorable.length}</strong> exercícios.
          </p>
          <p style={{ color:'#94a3b8', fontSize:'.9rem', marginBottom:28 }}>
            {wordIds.length} {wordIds.length === 1 ? 'palavra' : 'palavras'} · {pct}% de aproveitamento
          </p>
          <Link to="/dashboard">
            <Btn fullWidth>← Voltar ao painel</Btn>
          </Link>
        </div>
      </Layout>
    );
  }

  // ── Render input by type ──────────────────────────────────────────────────

  const renderInput = () => {
    if (ex.type === 'pronunciation_intro') {
      return (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'2.4rem', fontWeight:800, color:'#1e293b', marginBottom:16 }}>
            {ex._word.palavra}
          </div>
          {ex._word.definicao_pt && (
            <p style={{
              color:'#475569', fontSize:'1rem', lineHeight:1.7,
              marginBottom:24, textAlign:'left',
              background:'#f8fafc', padding:'14px 16px', borderRadius:8,
              borderLeft:'3px solid #166534',
            }}>
              {ex._word.definicao_pt}
            </p>
          )}
          {ex._word.audio_url && (
            <div>
              <button
                onClick={() => audioRef.current?.play()}
                style={{
                  background:'#f0fdf4', border:'3px solid #166534',
                  borderRadius:60, width:72, height:72, fontSize:'2rem',
                  cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 4px 14px rgba(22,101,52,.15)',
                }}
              >
                🔊
              </button>
              <p style={{ color:'#64748b', fontSize:'.82rem', marginTop:8, lineHeight:1.5 }}>
                Clique para ouvir novamente. Repita em voz alta.
              </p>
              <audio key={ex._word.audio_url} ref={audioRef} src={ex._word.audio_url} />
            </div>
          )}
        </div>
      );
    }

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

    if (ex.type === 'scenario_production') {
      return (
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); setAnswers(a => ({ ...a, [step]: e.target.value })); }}
          placeholder={`Escreva uma frase usando a palavra "${ex._word?.palavra}"…`}
          disabled={isChecked || evaluating}
          rows={3}
          style={{
            width:'100%', padding:'11px 14px', resize:'vertical',
            border:`1.5px solid ${isChecked ? (isCorrect ? '#22c55e' : '#f59e0b') : '#cbd5e1'}`,
            borderRadius:8, fontSize:'1rem', outline:'none', fontFamily:'inherit',
          }}
        />
      );
    }

    // fill_in_the_blank / sentence_building
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
    if (ex.type === 'scenario_production') {
      const ev = evaluations[step];
      if (!ev) return null;
      return (
        <div>
          <p style={{ margin:0 }}>{ev.correto ? '✅ Ótimo uso da palavra!' : '🟡 Quase lá — dá pra melhorar:'}</p>
          {ev.feedback && <p style={{ margin:'6px 0 0', fontWeight:400 }}>{ev.feedback}</p>}
          {ev.sugestao && (
            <p style={{ margin:'8px 0 0', fontWeight:400 }}>
              💡 Sugestão: <em>"{ev.sugestao}"</em>
            </p>
          )}
        </div>
      );
    }
    if (ex.type === 'sentence_building') {
      return isCorrect
        ? `✅ Boa frase! Exemplo: "${ex.answer}"`
        : `❌ Use a palavra "${ex._word?.palavra}" na frase. Exemplo: "${ex.answer}"`;
    }
    return isCorrect ? '✅ Correto!' : `❌ A resposta correta era: "${ex.answer}"`;
  };

  return (
    <Layout>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <Link to="/dashboard" style={{ color:'#94a3b8', fontSize:'1.2rem' }}>←</Link>
          <div style={{ flex:1 }}>
            <h2 style={{ color:'#3C5A99', fontWeight:700 }}>
              Exercícios —{' '}
              <span style={{ fontSize:'1rem', fontWeight:500 }}>
                {wordIds.length} {wordIds.length === 1 ? 'palavra' : 'palavras'}
              </span>
            </h2>
            {/* Progress bar — dots per exercise */}
            <div style={{ display:'flex', gap:3, marginTop:5, flexWrap:'wrap', maxWidth:560 }}>
              {exercises.map((_, i) => (
                <div key={i} style={{
                  width: exercises.length > 30 ? 14 : 22,
                  height:5, borderRadius:3,
                  background: checked[i] !== undefined
                    ? (checked[i] ? '#22c55e' : '#ef4444')
                    : i === step ? '#3C5A99' : '#e2e8f0',
                }}/>
              ))}
            </div>
          </div>
          <button
            onClick={toggleMute}
            title={muted ? 'Ativar som' : 'Silenciar'}
            style={{
              background: 'none',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '5px 9px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: muted ? '#cbd5e1' : '#3C5A99',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>

        <div style={{ background:'#fff', borderRadius:14, padding:28, boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
          {/* Type badge + word label */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4, flexWrap:'wrap', gap:6 }}>
            <span style={{
              background: colors.bg, color: colors.color,
              fontSize:'.75rem', fontWeight:600, padding:'3px 10px', borderRadius:20, letterSpacing:.5,
            }}>
              {TYPE_LABEL[ex.type] || ex.type.toUpperCase().replace(/_/g,' ')}
            </span>
            {ex._word?.palavra && (
              <span style={{
                background:'#f1f5f9', color:'#64748b',
                fontSize:'.78rem', fontWeight:500, padding:'3px 10px', borderRadius:20,
              }}>
                {ex._word.palavra}
              </span>
            )}
          </div>

          <p style={{ fontSize:'1.1rem', color:'#1e293b', margin:'16px 0 20px', lineHeight:1.7 }}>
            {ex.question}
          </p>

          {renderInput()}

          {isChecked && (
            <div style={{
              marginTop:16, padding:'12px 16px', borderRadius:8,
              background: isCorrect ? '#dcfce7' : ex.type === 'scenario_production' ? '#fffbeb' : '#fef2f2',
              color: isCorrect ? '#166534' : ex.type === 'scenario_production' ? '#92400e' : '#991b1b',
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
            {ex.type === 'pronunciation_intro' ? (
              <Btn onClick={next}>Continuar →</Btn>
            ) : !isChecked ? (
              <Btn onClick={check} disabled={!answers[step] || evaluating}>
                {evaluating ? 'Avaliando…' : ex.type === 'scenario_production' ? 'Verificar resposta' : 'Verificar'}
              </Btn>
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
