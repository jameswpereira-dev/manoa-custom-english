import React from 'react';

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3C5A99 0%, #2d4475 50%, #1a2a52 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        padding: '40px 36px', width: '100%', maxWidth: 420,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <FlagLogo />
          <h1 style={{ color: '#3C5A99', fontSize: '1.6rem', fontWeight: 700, marginTop: 12 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ color: '#64748b', fontSize: '.9rem', marginTop: 4 }}>{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function FlagLogo() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
        <rect width="40" height="28" rx="4" fill="#B22234"/>
        <rect y="0"  width="40" height="4" fill="#B22234"/>
        <rect y="4"  width="40" height="2.8" fill="white"/>
        <rect y="6.8" width="40" height="4" fill="#B22234"/>
        <rect y="10.8" width="40" height="2.8" fill="white"/>
        <rect y="13.6" width="40" height="4" fill="#B22234"/>
        <rect y="17.6" width="40" height="2.8" fill="white"/>
        <rect y="20.4" width="40" height="7.6" fill="#B22234"/>
        <rect width="18" height="15" rx="2" fill="#3C5A99"/>
      </svg>
      <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#3C5A99', letterSpacing: 1 }}>
        MANOA
      </span>
    </div>
  );
}
