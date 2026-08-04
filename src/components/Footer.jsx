import React from 'react';

export default function Footer() {
  return (
    <footer 
      style={{
        padding: 'var(--spacing-16) 0',
        borderTop: '1px solid var(--color-border)',
        background: 'transparent',
        fontSize: '10px',
        color: 'var(--color-text-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 'var(--spacing-16)'
      }}
    >
      <span>All values are in INR</span>
      <span>Data as of 20 May 2025, 09:30 AM</span>
    </footer>
  );
}
