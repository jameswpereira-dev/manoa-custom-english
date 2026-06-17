import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';

import LandingPage     from './pages/LandingPage';
import Planos          from './pages/Planos';
import Login           from './pages/Login';
import Register        from './pages/Register';
import ForgotPass      from './pages/ForgotPassword';
import VerifyEmail     from './pages/VerifyEmail';
import Checkout        from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Dashboard       from './pages/Dashboard';
import Upload          from './pages/Upload';
import Study           from './pages/Study';
import Exercises       from './pages/Exercises';
import MultiExercises  from './pages/MultiExercises';
import Dictation       from './pages/Dictation';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (user) {
    const plan = new URLSearchParams(location.search).get('plan');
    return <Navigate to={plan ? `/checkout?plan=${plan}` : '/dashboard'} replace />;
  }
  return children;
}

function VerifyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.emailVerified) return <Navigate to="/dashboard" replace />;
  return children;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verificar-email" replace />;
  return children;
}

function SubscribedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();

  if (authLoading || (user && subLoading)) return <FullLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verificar-email" replace />;
  if (!subscription || subscription.status !== 'ativo') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function FullLoader() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <div style={{ width:40, height:40, border:'4px solid #e2e8f0', borderTop:'4px solid #1E3A6A', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SubscriptionProvider>
          <Routes>
            <Route path="/"              element={<LandingPage />} />
            <Route path="/planos"        element={<Planos />} />
            <Route path="/login"         element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/cadastro"      element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/esqueci-senha" element={<PublicRoute><ForgotPass /></PublicRoute>} />
            <Route path="/verificar-email" element={<VerifyRoute><VerifyEmail /></VerifyRoute>} />

            <Route path="/checkout"         element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="/checkout-success" element={<PrivateRoute><CheckoutSuccess /></PrivateRoute>} />
            <Route path="/sucesso"          element={<PrivateRoute><CheckoutSuccess /></PrivateRoute>} />
            <Route path="/dashboard"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />

            <Route path="/upload"              element={<SubscribedRoute><Upload /></SubscribedRoute>} />
            <Route path="/estudo/:wordId"      element={<SubscribedRoute><Study /></SubscribedRoute>} />
            <Route path="/exercicios/:wordId"  element={<SubscribedRoute><Exercises /></SubscribedRoute>} />
            <Route path="/exercicios-multiplos" element={<SubscribedRoute><MultiExercises /></SubscribedRoute>} />
            <Route path="/ditado/:wordId"      element={<SubscribedRoute><Dictation /></SubscribedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SubscriptionProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
