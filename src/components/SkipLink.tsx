import React from 'react';

// Simple skip-to-content link for keyboard users
const SkipLink: React.FC = () => (
  <a
    href="#main-content"
    className="skip-link"
    onFocus={(e)=>{ e.currentTarget.classList.add('skip-link--focus'); }}
    onBlur={(e)=>{ e.currentTarget.classList.remove('skip-link--focus'); }}
  >Ga naar hoofdinhoud</a>
);

// minimal styles appended globally (could move to a dedicated css file if needed)
if (typeof document !== 'undefined' && !document.getElementById('skip-link-style')) {
  const style = document.createElement('style');
  style.id = 'skip-link-style';
  style.textContent = `.skip-link{position:fixed;top:0;left:0;transform:translateY(-120%);background:#0d47a1;color:#fff;padding:8px 14px;z-index:4000;border-radius:0 0 6px 0;font-weight:600;text-decoration:none;transition:transform .25s} .skip-link.skip-link--focus{transform:translateY(0)}`;
  document.head.appendChild(style);
}

export default SkipLink;