import React from 'react';

export default function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display:'block', fontSize:'.85rem', fontWeight:500, color:'#475569', marginBottom:5 }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%', padding: '10px 14px',
          border: `1.5px solid ${error ? '#ef4444' : '#cbd5e1'}`,
          borderRadius: 8, fontSize: '0.95rem',
          outline: 'none', transition: 'border-color .15s',
          background: '#fff',
          ...props.style,
        }}
        onFocus={e => (e.target.style.borderColor = error ? '#ef4444' : '#3C5A99')}
        onBlur={e  => (e.target.style.borderColor = error ? '#ef4444' : '#cbd5e1')}
      />
      {error && <span style={{ color:'#ef4444', fontSize:'.8rem', marginTop:3, display:'block' }}>{error}</span>}
    </div>
  );
}
