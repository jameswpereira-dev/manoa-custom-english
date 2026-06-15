import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import Input    from '../components/Input';
import Btn      from '../components/Btn';
import { auth, sendPasswordResetEmail } from '../services/firebase';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(err.code === 'auth/user-not-found' ? 'E-mail não encontrado.' : 'Erro ao enviar. Tente novamente.');
    } finally { setLoading(false); }
  };

  return (
    <AuthCard title="Recuperar senha" subtitle="Enviaremos um link para seu e-mail">
      {sent ? (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:12 }}>📧</div>
          <p style={{ color:'#22c55e', fontWeight:500, marginBottom:8 }}>E-mail enviado!</p>
          <p style={{ color:'#64748b', fontSize:'.9rem', marginBottom:20 }}>
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </p>
          <Link to="/login">
            <Btn fullWidth>Voltar ao login</Btn>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="seu@email.com" />
          {error && <p style={{ color:'#ef4444', fontSize:'.85rem', marginBottom:12 }}>{error}</p>}
          <Btn type="submit" fullWidth loading={loading}>Enviar link de recuperação</Btn>
          <p style={{ marginTop:16, textAlign:'center', fontSize:'.85rem', color:'#64748b' }}>
            <Link to="/login" style={{ color:'#3C5A99' }}>← Voltar ao login</Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
