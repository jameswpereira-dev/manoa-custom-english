import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import Input    from '../components/Input';
import Btn      from '../components/Btn';
import {
  auth, signInWithEmailAndPassword,
  signInWithPopup, googleProvider,
} from '../services/firebase';

export default function Login() {
  const nav    = useNavigate();
  const [searchParams] = [new URLSearchParams(window.location.search)];
  const plan   = searchParams.get('plan');
  const dest   = plan ? `/checkout?plan=${plan}` : '/dashboard';

  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState('');

  const handleEmail = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      nav(dest);
    } catch (err) {
      setError(mapError(err.code));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setGLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      nav(dest);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError(mapError(err.code));
    } finally { setGLoading(false); }
  };

  return (
    <AuthCard title="Entrar" subtitle="Acesse seu painel de aprendizado">
      <Btn variant="google" fullWidth onClick={handleGoogle} loading={gLoading} style={{ marginBottom:20 }}>
        <GoogleIcon /> Entrar com Google
      </Btn>

      <Divider />

      <form onSubmit={handleEmail}>
        <Input label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="seu@email.com" />
        <Input label="Senha"  type="password" value={senha} onChange={e=>setSenha(e.target.value)} required placeholder="••••••••" />
        {error && <p style={{ color:'#ef4444', fontSize:'.85rem', marginBottom:12 }}>{error}</p>}
        <Btn type="submit" fullWidth loading={loading} style={{ marginTop:4 }}>Entrar</Btn>
      </form>

      <div style={{ marginTop:20, textAlign:'center', fontSize:'.85rem', color:'#64748b' }}>
        <Link to="/esqueci-senha" style={{ color:'#3C5A99' }}>Esqueci minha senha</Link>
        <span style={{ margin:'0 12px' }}>·</span>
        <Link to={plan ? `/cadastro?plan=${plan}` : '/cadastro'} style={{ color:'#3C5A99' }}>Criar conta</Link>
      </div>
    </AuthCard>
  );
}

function Divider() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'0 0 20px' }}>
      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
      <span style={{ color:'#94a3b8', fontSize:'.8rem' }}>ou</span>
      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function mapError(code) {
  const map = {
    'auth/user-not-found':    'E-mail não encontrado.',
    'auth/wrong-password':    'Senha incorreta.',
    'auth/invalid-email':     'E-mail inválido.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde e tente novamente.',
    'auth/invalid-credential':'E-mail ou senha incorretos.',
  };
  return map[code] || 'Erro ao entrar. Tente novamente.';
}
