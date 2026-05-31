import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onLangChange: (lang: string) => void;
  currentLang: string;
}

// Two real pages now. "About"/"Contact" remain anchors that scroll the footer.
const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', to: '/' },
  { labelKey: 'nav.diagnose', to: '/diagnose' },
];

const Header: React.FC<HeaderProps> = ({ onLangChange, currentLang }) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isSw = currentLang === 'sw';
  const location = useLocation();

  const handleToggle = () => onLangChange(isSw ? 'en' : 'sw');

  return (
    <>
      <header className="header">
        <div className="header-left">
          <Link to="/" className="branding" style={{ textDecoration: 'none' }}>
            <span className="logo">🌱</span>
            <div>
              <h1 className="app-title">{t('appName')}</h1>
              <span className="app-subtitle">{t('tagline')}</span>
            </div>
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.labelKey}>
                  <Link
                    to={item.to}
                    aria-current={location.pathname === item.to ? 'page' : undefined}
                    style={location.pathname === item.to ? { color: '#fff', background: 'rgba(255,255,255,0.15)' } : undefined}
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="header-actions">
          <label className="lang-switcher" aria-label={t('changeLang')}>
            <span className="lang-label">EN</span>
            <input type="checkbox" checked={isSw} onChange={handleToggle} />
            <span className="slider" />
            <span className="lang-label">SW</span>
          </label>

          <button
            className="cg-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      <nav className={`cg-drawer${menuOpen ? ' open' : ''}`} aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => (
          <Link key={item.labelKey} to={item.to} onClick={() => setMenuOpen(false)}>
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
    </>
  );
};

export default Header;
