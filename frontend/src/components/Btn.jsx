import React from 'react';

const variants = {
  primary: {
    background: '#3C5A99', color: '#fff', border: 'none',
  },
  red: {
    background: '#B22234', color: '#fff', border: 'none',
  },
  outline: {
    background: 'transparent', color: '#3C5A99',
    border: '1.5px solid #3C5A99',
  },
  google: {
    background: '#fff', color: '#374151',
    border: '1.5px solid #d1d5db',
  },
  ghost: {
    background: 'transparent', color: '#3C5A99', border: 'none',
  },
};

export default function Btn({ children, variant = 'primary', loading, fullWidth, style, ...props }) {
  const v = variants[variant] || variants.primary;
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        ...v,
        padding: '11px 20px',
        borderRadius: 8,
        fontSize: '0.95rem',
        fontWeight: 600,
        cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
        opacity: props.disabled || loading ? 0.65 : 1,
        transition: 'filter .15s, transform .1s',
        width: fullWidth ? '100%' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
      onMouseOver={e => !props.disabled && !loading && (e.currentTarget.style.filter = 'brightness(1.08)')}
      onMouseOut={e => (e.currentTarget.style.filter = '')}
    >
      {loading ? <Spin /> : children}
    </button>
  );
}

function Spin() {
  return (
    <span style={{
      width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)',
      borderTop: '2px solid #fff', borderRadius: '50%',
      display: 'inline-block', animation: 'spin .7s linear infinite',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}
