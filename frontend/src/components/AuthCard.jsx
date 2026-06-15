import React from 'react';
import logoManoa from '../logo-manoa.png';

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
          <img src={logoManoa} alt="MANOA" style={{ height: 48 }} />
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

