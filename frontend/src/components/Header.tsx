import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onLangChange: (lang: string) => void;
  currentLang: string;
}

const NAV_ITEMS = [
  { labelKey: 'nav.home',       href: '#' },
  { labelKey: 'nav.about',      href: '#about' },
  { labelKey: 'nav.howItWorks', href: '#how' },
  { labelKey: 'nav.contact',    href: '#contact' },
];

const Header: React.FC<HeaderProps> = ({ onLangChange, currentLang }) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isSw = currentLang === 'sw';

  const handleToggle = () => {
    onLangChange(isSw ? 'en' : 'sw');
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="branding">
            <span className="logo">🌱</span>
            <div>
              <h1 className="app-title">{t('appName')}</h1>
              <span className="app-subtitle">{t('tagline')}</span>
            </div>
          </div>

          {/* Desktop nav — hidden on mobile via CSS */}
          <nav className="main-nav" aria-label="Main navigation">
            <ul>
              {NAV_ITEMS.map(item => (
                <li key={item.labelKey}>
                  <a href={item.href}>{t(item.labelKey)}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="header-actions">
          {/* Language toggle */}
          <label className="lang-switcher" aria-label={t('changeLang')}>
            <span className="lang-label">EN</span>
            <input
              type="checkbox"
              checked={isSw}
              onChange={handleToggle}
            />
            <span className="slider" />
            <span className="lang-label">SW</span>
          </label>

          {/* Hamburger — visible on mobile only */}
          <button
            className="cg-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <nav
        className={`cg-drawer${menuOpen ? ' open' : ''}`}
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(item => (
          <a
            key={item.labelKey}
            href={item.href}
            onClick={() => setMenuOpen(false)}
          >
            {t(item.labelKey)}
          </a>
        ))}
      </nav>
    </>
  );
};

export default Header;
