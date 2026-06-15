import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const styles = {
  nav: {
    background: 'var(--blue)',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    boxShadow: '0 2px 8px rgba(0,0,0,.18)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none',
  },
  logoText: {
    color: '#fff', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '.5px',
  },
  logoSub: {
    color: 'rgba(255,255,255,.75)', fontSize: '.7rem', letterSpacing: '2px',
    textTransform: 'uppercase', display: 'block',
  },
  navActions: { display: 'flex', alignItems: 'center', gap: 16 },
  navLink: {
    color: 'rgba(255,255,255,.85)', fontSize: '.9rem', fontWeight: 500,
    textDecoration: 'none', padding: '6px 12px', borderRadius: 6,
    transition: 'background .15s',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none',
    padding: '6px 14px', borderRadius: 6, fontSize: '.85rem', fontWeight: 500,
    cursor: 'pointer', transition: 'background .15s',
  },
  main: { padding: '32px 24px', maxWidth: 960, margin: '0 auto' },
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <>
      <nav style={styles.nav}>
        <Link to="/dashboard" style={styles.logo}>
          <Flag />
          <span>
            <span style={styles.logoText}>MANOA</span>
            <span style={styles.logoSub}>Custom English</span>
          </span>
        </Link>
        <div style={styles.navActions}>
          <Link to="/dashboard" style={styles.navLink}>Painel</Link>
          <Link to="/upload"    style={styles.navLink}>+ Palavras</Link>
          {user && (
            <span style={{ color:'rgba(255,255,255,.65)', fontSize:'.82rem' }}>
              {user.displayName || user.email}
            </span>
          )}
          <button style={styles.logoutBtn} onClick={handleLogout}>Sair</button>
        </div>
      </nav>
      <main style={styles.main}>{children}</main>
    </>
  );
}

function Flag() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
      <rect width="28" height="20" rx="3" fill="#B22234"/>
      <rect y="0"  width="28" height="2.9" fill="#B22234"/>
      <rect y="2.9" width="28" height="2" fill="white"/>
      <rect y="4.9" width="28" height="2.9" fill="#B22234"/>
      <rect y="7.8" width="28" height="2" fill="white"/>
      <rect y="9.8" width="28" height="2.9" fill="#B22234"/>
      <rect y="12.7" width="28" height="2" fill="white"/>
      <rect y="14.7" width="28" height="2.9" fill="#B22234"/>
      <rect y="17.6" width="28" height="2.4" fill="#B22234"/>
      <rect width="12" height="10.8" rx="2" fill="#3C5A99"/>
    </svg>
  );
}
