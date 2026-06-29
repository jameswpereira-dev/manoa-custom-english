import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Briefcase, Sparkles, Headphones } from 'lucide-react';
import logoManoa from '../logo-manoa.png';
import { PLAN_CATALOG } from '../config/plans';

function useReveal(delay = 0) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setOn(true); },
      { threshold: 0.12 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity:    on ? 1 : 0,
      transform:  on ? 'none' : 'translateY(28px)',
      transition: `opacity .65s ease ${delay}ms, transform .65s ease ${delay}ms`,
    },
  };
}

function useCounter(target, duration = 1600) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    const step = target / (duration / 16);
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setCount(Math.round(cur));
      if (cur >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [started, target, duration]);
  return { ref, count };
}

const DEMO = [
  { prof:'TI & Redes',  icon:'💻', word:'throughput',       phon:'/ˈθruːpʊt/',        pt:'taxa de transferência',   en:'"The new switch doubled our network throughput during peak hours."'        },
  { prof:'Direito',     icon:'⚖️', word:'injunction',       phon:'/ɪnˈdʒʌŋkʃən/',    pt:'liminar / ordem judicial', en:'"The court issued a preliminary injunction to halt construction."'        },
  { prof:'Medicina',    icon:'🏥', word:'prognosis',        phon:'/prɒɡˈnoʊsɪs/',    pt:'prognóstico',              en:'"The prognosis improved significantly after early intervention."'          },
  { prof:'Engenharia',  icon:'⚙️', word:'tensile strength', phon:'/ˈtensaɪl streŋθ/', pt:'resistência à tração',    en:'"This alloy shows superior tensile strength under high structural load."'  },
];

const STATS = [
  { target:2400, suffix:'+', label:'Palavras geradas'     },
  { target:38,   suffix:'',  label:'Áreas profissionais'  },
  { target:97,   suffix:'%', label:'Taxa de satisfação'   },
  { target:340,  suffix:'+', label:'Profissionais ativos' },
];

const STEPS = [
  { Icon:Briefcase,  n:'01', title:'Informe sua profissão',   desc:'Diga em que setor você trabalha — TI, Direito, Medicina, Engenharia e mais de 35 áreas disponíveis.' },
  { Icon:Sparkles,   n:'02', title:'IA gera seu vocabulário', desc:'Nossa IA seleciona palavras, phrasal verbs e expressões técnicas realmente usadas na sua área.'       },
  { Icon:Headphones, n:'03', title:'Pratique e evolua',       desc:'Exercícios de lacuna, múltipla escolha e listening com pronúncia nativa — no seu ritmo.'             },
];

const TESTIMONIALS = [
  { name:'Marina S.',  role:'Engenheira de Redes · SP',  init:'MS', text:'"Finalmente um curso que não me ensina I eat an apple. Em 3 semanas aprendi os termos que uso toda semana com clientes americanos."' },
  { name:'Rodrigo B.', role:'Advogado Empresarial · RJ', init:'RB', text:'"Precisava ler contratos em inglês sem depender do Google Tradutor. O vocabulário jurídico da MANOA foi exatamente o que faltava."' },
  { name:'Camila F.',  role:'Médica Intensivista · BH',  init:'CF', text:'"O inglês médico é muito específico. A MANOA entende isso e gera palavras com contexto clínico real. Uso todo dia na leitura de artigos."' },
];

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
  'Frases no contexto real',
];

function Divider() {
  return <hr style={{ border:'none', borderTop:'1px solid rgba(59,130,246,0.12)', margin:0 }} />;
}

function Tag({ children }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.28)', color:'#93C5FD', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:12, letterSpacing:.5, marginBottom:16 }}>
      {children}
    </div>
  );
}

function SectionHead({ tag, title, sub }) {
  return (
    <div style={{ textAlign:'center', marginBottom:52 }}>
      <Tag>{tag}</Tag>
      <h2 style={{ fontSize:'clamp(1.7rem,3vw,2.4rem)', fontWeight:900, letterSpacing:'-1px', margin:'0 0 12px', color:'#EEF5FF' }}>{title}</h2>
      {sub && <p style={{ fontSize:14, color:'#94A3B8', maxWidth:440, margin:'0 auto' }}>{sub}</p>}
    </div>
  );
}

function PrimaryBtn({ children, onClick, large }) {
  return (
    <button
      onClick={onClick}
      style={{ background:'#3B82F6', color:'#fff', border:'none', padding:large?'16px 40px':'13px 28px', borderRadius:10, fontSize:large?16:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 30px rgba(59,130,246,0.35)', transition:'filter .15s, transform .1s' }}
      onMouseOver={e=>{ e.currentTarget.style.filter='brightness(1.1)'; e.currentTarget.style.transform='translateY(-1px)'; }}
      onMouseOut={e=>{ e.currentTarget.style.filter=''; e.currentTarget.style.transform=''; }}
    >{children}</button>
  );
}

function GhostBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background:'transparent', color:'#94A3B8', border:'1px solid rgba(59,130,246,0.15)', padding:'13px 22px', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'inherit', transition:'border-color .15s, color .15s' }}
      onMouseOver={e=>{ e.currentTarget.style.borderColor='rgba(59,130,246,0.35)'; e.currentTarget.style.color='#EEF5FF'; }}
      onMouseOut={e=>{ e.currentTarget.style.borderColor='rgba(59,130,246,0.15)'; e.currentTarget.style.color='#94A3B8'; }}
    >{children}</button>
  );
}

function NavBtn({ children, onClick, ghost }) {
  return (
    <button
      onClick={onClick}
      style={{ background:ghost?'transparent':'#3B82F6', color:ghost?'#94A3B8':'#fff', border:ghost?'1px solid rgba(59,130,246,0.2)':'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:ghost?400:700, cursor:'pointer', fontFamily:'inherit' }}
    >{children}</button>
  );
}

function StatItem({ target, suffix, label }) {
  const { ref, count } = useCounter(target);
  return (
    <div ref={ref} style={{ textAlign:'center' }}>
      <div style={{ fontSize:'clamp(2rem,4vw,2.8rem)', fontWeight:900, letterSpacing:'-1px', color:'#EEF5FF' }}>
        {count.toLocaleString('pt-BR')}{suffix}
      </div>
      <div style={{ fontSize:12, color:'#94A3B8', marginTop:5 }}>{label}</div>
    </div>
  );
}

function VocabCard() {
  const [idx, setIdx]         = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % DEMO.length); setVisible(true); }, 380);
    }, 4000);
    return () => clearInterval(t);
  }, []);
  const d = DEMO[idx];
  return (
    <div style={{ background:'#0A1628', border:'1px solid rgba(59,130,246,0.15)', borderRadius:16, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
      <div style={{ background:'#0E2040', padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(59,130,246,0.12)' }}>
        <div style={{ display:'flex', gap:5 }}>
          {['#EF4444','#F59E0B','#22C55E'].map((c,i) => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:c, opacity:.7 }} />)}
        </div>
        <div style={{ fontSize:10, color:'#94A3B8', fontFamily:'monospace' }}>manoa · vocabulário</div>
        <div style={{ width:40 }} />
      </div>
      <div style={{ padding:'16px 20px 0' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', color:'#93C5FD', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:12, letterSpacing:.5 }}>
          {d.icon} {d.prof}
        </span>
      </div>
      <div style={{ padding:'16px 20px 20px', opacity:visible?1:0, transition:'opacity .35s ease' }}>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-.5px', color:'#EEF5FF' }}>{d.word}</div>
          <div style={{ fontSize:12, color:'#94A3B8', fontFamily:'monospace', marginTop:3 }}>{d.phon}</div>
        </div>
        <div style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.22)', borderRadius:8, padding:'10px 14px', marginBottom:14 }}>
          <div style={{ fontSize:10, color:'#93C5FD', fontWeight:700, marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>Tradução</div>
          <div style={{ fontSize:14, color:'#EEF5FF', fontWeight:600 }}>{d.pt}</div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, color:'#94A3B8', fontWeight:700, marginBottom:7, textTransform:'uppercase', letterSpacing:.5 }}>Exemplo</div>
          <div style={{ fontSize:13, lineHeight:1.7, color:'#CBD5E1', fontStyle:'italic' }}>{d.en}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['▶ Pronúncia','✎ Praticar','★ Salvar'].map(label => (
            <button key={label} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(59,130,246,0.15)', color:'#94A3B8', padding:'7px 12px', borderRadius:7, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'10px 20px', borderTop:'1px solid rgba(59,130,246,0.12)', display:'flex', gap:5, justifyContent:'center' }}>
        {DEMO.map((_,i) => <div key={i} style={{ height:6, borderRadius:3, background:i===idx?'#3B82F6':'rgba(255,255,255,0.12)', width:i===idx?18:6, transition:'all .3s' }} />)}
      </div>
    </div>
  );
}

function StepCard({ step, delay, highlight }) {
  const r = useReveal(delay);
  const { Icon } = step;
  return (
    <div ref={r.ref} style={{ ...r.style, background:'#0E2040', border:`1px solid ${highlight?'rgba(59,130,246,0.35)':'rgba(59,130,246,0.15)'}`, borderRadius:14, padding:28 }}>
      <div style={{ width:52, height:52, borderRadius:12, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
        <Icon size={24} color="#3B82F6" strokeWidth={1.5} />
      </div>
      <div style={{ fontSize:10, color:'#3B82F6', fontWeight:800, letterSpacing:1, marginBottom:8 }}>PASSO {step.n}</div>
      <h3 style={{ fontSize:15, fontWeight:700, margin:'0 0 10px', color:'#EEF5FF', letterSpacing:'-.3px' }}>{step.title}</h3>
      <p style={{ fontSize:13, color:'#94A3B8', lineHeight:1.8, margin:0 }}>{step.desc}</p>
    </div>
  );
}

function TestiCard({ t, delay, highlight }) {
  const r = useReveal(delay);
  return (
    <div ref={r.ref} style={{ ...r.style, background:'#0E2040', border:`1px solid ${highlight?'rgba(59,130,246,0.35)':'rgba(59,130,246,0.15)'}`, borderRadius:14, padding:26 }}>
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#93C5FD' }}>{t.init}</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#EEF5FF' }}>{t.name}</div>
          <div style={{ fontSize:11, color:'#94A3B8' }}>{t.role}</div>
        </div>
      </div>
      <div style={{ marginBottom:12, color:'#F59E0B', fontSize:13 }}>★★★★★</div>
      <p style={{ fontSize:13, color:'#CBD5E1', lineHeight:1.8, margin:0 }}>{t.text}</p>
    </div>
  );
}

function PlanCard({ plan, delay, onAssinar }) {
  const r = useReveal(delay);
  return (
    <div ref={r.ref} style={{ ...r.style, background:'#0E2040', border:`${plan.popular?'2px':'1px'} solid ${plan.popular?'#3B82F6':'rgba(59,130,246,0.15)'}`, borderRadius:16, padding:'32px 24px', position:'relative', transform:plan.popular?'scale(1.05)':'none', boxShadow:plan.popular?'0 0 50px rgba(59,130,246,0.18)':'none' }}>
      {plan.popular && (
        <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'#3B82F6', color:'#fff', fontSize:10, fontWeight:800, padding:'4px 16px', borderRadius:12, whiteSpace:'nowrap', letterSpacing:.5 }}>⭐ MAIS POPULAR</div>
      )}
      <div style={{ fontSize:11, color:plan.popular?'#93C5FD':'#94A3B8', fontWeight:800, letterSpacing:1, marginBottom:8 }}>{plan.name.toUpperCase()}</div>
      <div style={{ fontSize:'clamp(2rem,4vw,2.5rem)', fontWeight:900, letterSpacing:'-1.5px', marginBottom:2, color:'#EEF5FF' }}>{plan.price}</div>
      <div style={{ fontSize:12, color:'#94A3B8', marginBottom:26 }}>/mês · {plan.words}</div>
      <div style={{ borderTop:'1px solid rgba(59,130,246,0.12)', paddingTop:20, marginBottom:26, display:'flex', flexDirection:'column', gap:10 }}>
        {FEATURES.map((feat,fi) => (
          <div key={feat} style={{ fontSize:13, color:fi===4&&plan.popular?'#93C5FD':'#CBD5E1', fontWeight:fi===4&&plan.popular?600:400 }}>
            <span style={{ color:fi===4&&plan.popular?'#93C5FD':'#3B82F6', fontWeight:700, marginRight:8 }}>✓</span>{feat}
          </div>
        ))}
      </div>
      {plan.popular
        ? <button onClick={() => onAssinar(plan.id)} style={{ width:'100%', padding:14, borderRadius:9, background:'#3B82F6', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 6px 24px rgba(59,130,246,0.4)' }}>Assinar agora</button>
        : <button onClick={() => onAssinar(plan.id)} style={{ width:'100%', padding:13, borderRadius:9, background:'transparent', color:'#EEF5FF', border:'1px solid rgba(59,130,246,0.2)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Assinar</button>
      }
    </div>
  );
}

export default function LandingPage() {
  const nav       = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const planosRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('planos') === '1' && planosRef.current) {
      setTimeout(() => planosRef.current.scrollIntoView({ behavior:'smooth' }), 150);
    }
  }, [location.search]);

  const handleAssinar  = (plan) => nav(user ? `/checkout?plan=${plan}` : `/cadastro?plan=${plan}`);
  const scrollToPlanos = () => planosRef.current?.scrollIntoView({ behavior:'smooth' });

  const heroL = useReveal(0);
  const heroR = useReveal(150);
  const statsR = useReveal(0);
  const howH  = useReveal(0);
  const testH = useReveal(0);
  const planH = useReveal(0);
  const ctaR  = useReveal(0);

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'#050D1A', color:'#EEF5FF', margin:0, padding:0, overflowX:'hidden' }}>

      <header style={{ background:'rgba(5,13,26,0.95)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(59,130,246,0.15)', padding:'0 32px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src={logoManoa} alt="MANOA" style={{ height:28 }} />
          <div>
            <div style={{ fontWeight:800, fontSize:15, letterSpacing:'-.5px', color:'#EEF5FF', lineHeight:1.1 }}>MANOA</div>
            <div style={{ fontSize:9, color:'#94A3B8', letterSpacing:'2.5px', textTransform:'uppercase' }}>Custom English</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {user
            ? <NavBtn onClick={() => nav('/dashboard')}>Meu painel</NavBtn>
            : <><NavBtn ghost onClick={() => nav('/login')}>Entrar</NavBtn><NavBtn onClick={scrollToPlanos}>Ver planos</NavBtn></>
          }
        </div>
      </header>

      <section style={{ padding:'clamp(64px,8vw,96px) 32px', maxWidth:1160, margin:'0 auto', display:'flex', alignItems:'center', gap:'clamp(32px,5vw,72px)', flexWrap:'wrap' }}>
        <div ref={heroL.ref} style={{ ...heroL.style, flex:'1 1 400px' }}>
          <Tag>✦ Powered by AI · Vocabulário profissional</Tag>
          <h1 style={{ fontSize:'clamp(2.2rem,4.5vw,3.3rem)', fontWeight:900, lineHeight:1.08, letterSpacing:'-2px', margin:'0 0 22px', color:'#EEF5FF' }}>
            Inglês que serve<br />de verdade<br /><span style={{ color:'#3B82F6' }}>para a sua carreira.</span>
          </h1>
          <p style={{ fontSize:15, color:'#94A3B8', lineHeight:1.85, maxWidth:430, margin:'0 0 36px' }}>
            A MANOA usa inteligência artificial para gerar vocabulário, expressões e exercícios da <strong style={{ color:'#EEF5FF', fontWeight:600 }}>sua área profissional</strong> — não do livro que ensina "I drink milk".
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <PrimaryBtn onClick={scrollToPlanos}>Começar agora →</PrimaryBtn>
            <GhostBtn onClick={() => {}}>Como funciona</GhostBtn>
          </div>
          <div style={{ display:'flex', gap:24, marginTop:28, flexWrap:'wrap' }}>
            {['Sem cartão no teste','Cancele quando quiser','Palavras da sua área'].map(t => (
              <div key={t} style={{ fontSize:12, color:'#94A3B8' }}><span style={{ color:'#22C55E', fontWeight:700 }}>✓</span> {t}</div>
            ))}
          </div>
        </div>
        <div ref={heroR.ref} style={{ ...heroR.style, flex:'1 1 340px', maxWidth:410 }}>
          <VocabCard />
          <div style={{ textAlign:'center', marginTop:12, fontSize:11, color:'#94A3B8' }}>✦ Vocabulário real · gerado por IA · da sua profissão</div>
        </div>
      </section>

      <Divider />

      <section style={{ background:'#0A1628', padding:'48px 32px' }}>
        <div ref={statsR.ref} style={{ ...statsR.style, maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:32 }}>
          {STATS.map((s,i) => <StatItem key={i} {...s} />)}
        </div>
      </section>

      <Divider />

      <section style={{ padding:'clamp(64px,8vw,96px) 32px', maxWidth:1100, margin:'0 auto' }}>
        <div ref={howH.ref} style={howH.style}>
          <SectionHead tag="Como funciona" title={<>Em 3 passos, vocabulário<br />feito para você.</>} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:24 }}>
          {STEPS.map((s,i) => <StepCard key={i} step={s} delay={i*120} highlight={i===1} />)}
        </div>
      </section>

      <Divider />

      <section style={{ background:'#0A1628', padding:'clamp(64px,8vw,96px) 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div ref={testH.ref} style={testH.style}>
            <SectionHead tag="Depoimentos" title="O que nossos alunos dizem" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:22 }}>
            {TESTIMONIALS.map((t,i) => <TestiCard key={i} t={t} delay={i*100} highlight={i===1} />)}
          </div>
        </div>
      </section>

      <Divider />

      <section ref={planosRef} id="planos" style={{ padding:'clamp(64px,8vw,96px) 32px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div ref={planH.ref} style={planH.style}>
            <SectionHead tag="Planos" title="Escolha o seu plano" sub="Todos incluem exercícios personalizados, áudio nativo e vocabulário da sua profissão." />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:24, alignItems:'center' }}>
            {PLANS.map((p,i) => <PlanCard key={p.id} plan={p} delay={i*100} onAssinar={handleAssinar} />)}
            {/* Pix one-time card */}
            <div style={{
              background: '#0E2040', border: '2px dashed rgba(34,197,94,0.4)',
              borderRadius: 16, padding: '32px 24px', position: 'relative',
            }}>
              <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'#16a34a', color:'#fff', fontSize:10, fontWeight:800, padding:'4px 16px', borderRadius:12, whiteSpace:'nowrap', letterSpacing:.5 }}>
                PAGUE UMA VEZ
              </div>
              <div style={{ fontSize:11, color:'#86efac', fontWeight:800, letterSpacing:1, marginBottom:8 }}>PACOTE AVULSO PIX</div>
              <div style={{ fontSize:'clamp(2rem,4vw,2.5rem)', fontWeight:900, letterSpacing:'-1.5px', marginBottom:2, color:'#EEF5FF' }}>R$ 39,90</div>
              <div style={{ fontSize:12, color:'#94A3B8', marginBottom:26 }}>pagamento único · 10 palavras · 30 dias</div>
              <div style={{ borderTop:'1px solid rgba(34,197,94,0.15)', paddingTop:20, marginBottom:26, display:'flex', flexDirection:'column', gap:10 }}>
                {FEATURES.map(feat => (
                  <div key={feat} style={{ fontSize:13, color:'#CBD5E1' }}>
                    <span style={{ color:'#22c55e', fontWeight:700, marginRight:8 }}>✓</span>{feat}
                  </div>
                ))}
                <div style={{ fontSize:13, color:'#64748b' }}>
                  <span style={{ color:'#475569', fontWeight:700, marginRight:8 }}>○</span>Sem renovação automática
                </div>
              </div>
              <button
                onClick={() => nav(user ? '/pix-payment' : '/cadastro')}
                style={{ width:'100%', padding:13, borderRadius:9, background:'#16a34a', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
              >
                Pagar com Pix
              </button>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background:'#0A1628', borderTop:'1px solid rgba(59,130,246,0.15)', borderBottom:'1px solid rgba(59,130,246,0.15)', padding:'clamp(64px,8vw,88px) 32px', textAlign:'center' }}>
        <div ref={ctaR.ref} style={ctaR.style}>
          <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.6rem)', fontWeight:900, letterSpacing:'-1px', margin:'0 0 16px', color:'#EEF5FF' }}>Pronto para falar inglês<br />da sua profissão?</h2>
          <p style={{ fontSize:15, color:'#94A3B8', margin:'0 auto 36px', maxWidth:420 }}>Comece hoje. As primeiras palavras chegam em minutos.</p>
          <PrimaryBtn onClick={scrollToPlanos} large>Começar agora →</PrimaryBtn>
        </div>
      </section>

      <footer style={{ background:'#020810', padding:'48px 32px', textAlign:'center' }}>
        <img src={logoManoa} alt="MANOA" style={{ height:24, marginBottom:8, opacity:.7 }} />
        <div style={{ fontSize:18, fontWeight:900, letterSpacing:'-.5px', marginBottom:4, color:'#EEF5FF' }}>MANOA</div>
        <div style={{ fontSize:10, color:'#94A3B8', letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:20 }}>Custom English</div>
        <div style={{ fontSize:12, color:'#94A3B8', marginBottom:4 }}>@manoacustomenglish</div>
        <div style={{ fontSize:12, color:'#94A3B8' }}>manoacustomenglish.com</div>
        <div style={{ fontSize:11, color:'rgba(148,163,184,0.3)', marginTop:28 }}>© 2025 MANOA Custom English · Todos os direitos reservados</div>
      </footer>

    </div>
  );
}
