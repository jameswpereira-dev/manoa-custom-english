import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import Btn      from '../components/Btn';
import { auth, sendEmailVerification, reload, signOut } from '../services/firebase';

export default function VerifyEmail() {
  const location = useLocation();
  const nav       = useNavigate();
  const email     = location.state?.email || auth.currentUser?.email || '';

  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    if (!auth.currentUser) {
      nav('/login');
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        await reload(auth.currentUser);
        if (auth.currentUser?.emailVerified) {
          clearInterval(pollRef.current);
          nav('/dashboard');
        }
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [nav]);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setError(''); setSending(true);
    try {
      await sendEmailVerification(auth.currentUser, { url: 'https://manoacustomenglish.com/login' });
      setSent(true);
      setTimeout(() => setSent(false), 8000);
    } catch (err) {
      setError(
        err.code === 'auth/too-many-requests'
          ? 'Muitas tentativas. Aguarde alguns minutos antes de reenviar.'
          : 'Não foi possível reenviar o e-mail. Tente novamente.'
      );
    } finally { setSending(false); }
  };

  const handleTrocarConta = async () => {
    clearInterval(pollRef.current);
    await signOut(auth);
    nav('/login');
  };

  return (
    <AuthCard title="Confirme seu e-mail" subtitle="Falta só um passo para começar">
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{
          width:64, height:64, borderRadius:'50%', background:'#eff6ff',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 20px', fontSize:28,
        }}>✉️</div>
        <p style={{ color:'#475569', fontSize:'.92rem', lineHeight:1.7, margin:0 }}>
          Enviamos um link de confirmação para
        </p>
        <p style={{ color:'#3C5A99', fontWeight:700, fontSize:'.95rem', margin:'4px 0 16px' }}>
          {email}
        </p>
        <p style={{ color:'#94a3b8', fontSize:'.85rem', lineHeight:1.7, margin:0 }}>
          Clique no link para ativar sua conta. Esta página atualiza automaticamente assim que você confirmar.
        </p>
      </div>

      {error && <p style={{ color:'#ef4444', fontSize:'.85rem', textAlign:'center', marginBottom:12 }}>{error}</p>}
      {sent && <p style={{ color:'#22c55e', fontSize:'.85rem', textAlign:'center', marginBottom:12 }}>E-mail reenviado com sucesso.</p>}

      <Btn fullWidth loading={sending} onClick={handleResend} style={{ marginBottom:12 }}>
        Reenviar e-mail
      </Btn>

      <button
        onClick={handleTrocarConta}
        style={{
          width:'100%', background:'none', border:'none', color:'#64748b',
          fontSize:'.85rem', cursor:'pointer', padding:'8px 0',
        }}
      >
        Usar outro e-mail
      </button>
    </AuthCard>
  );
}
