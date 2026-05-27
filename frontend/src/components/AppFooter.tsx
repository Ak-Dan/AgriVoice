import React from 'react';
import { useTranslation } from 'react-i18next';

const AppFooter: React.FC = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { label: t('nav.home'),       href: '#' },
    { label: t('nav.about'),      href: '#about' },
    { label: t('nav.howItWorks'), href: '#how' },
    { label: t('nav.contact'),    href: '#contact' },
    { label: t('footer.faq'),     href: '#help' },
    { label: t('footer.privacy'), href: '#privacy' },
  ];

  const tips = [
    t('footer.tip1'),
    t('footer.tip2'),
    t('footer.tip3'),
    t('footer.tip4'),
    t('footer.tip5'),
  ];

  const socials = ['Facebook', 'Twitter', 'LinkedIn', 'Instagram'];

  return (
    <footer className="cg-footer" id="contact">
      <div className="cg-footer-grid">

        {/* ── Column 1: About ── */}
        <section className="cg-footer-sec" id="about">
          <div className="cg-footer-logo-row">
            <span className="cg-footer-logo-icon">🌱</span>
            <span className="cg-footer-logo-text">{t('appName')}</span>
          </div>
          <h3 className="cg-footer-h">{t('footer.aboutTitle')}</h3>
          <p className="cg-footer-text">{t('footer.aboutText')}</p>
          <p className="cg-footer-text">🏫 {t('mmuTag')}</p>
          <p className="cg-footer-text">🤖 {t('poweredBy')} · INT8 ONNX</p>
          <div className="cg-footer-social">
            {socials.map(s => (
              <a key={s} className="cg-footer-link" href="#">
                {s}
              </a>
            ))}
          </div>
        </section>

        {/* ── Column 2: Contact ── */}
        <section className="cg-footer-sec">
          <h3 className="cg-footer-h">📬 {t('footer.contactTitle')}</h3>
          <div className="cg-footer-contact-row">
            <span>✉</span>
            <a className="cg-footer-link" href="mailto:agrivoice@udara.com">
              agrivoice@udara.com
            </a>
          </div>
          <div className="cg-footer-contact-row">
            <span>📞</span>
            <a className="cg-footer-link" href="tel:+254700000000">
              +254 718 383 661
            </a>
          </div>
          <div className="cg-footer-contact-row">
            <span>📍</span>
            <span>NSK AI Udara Project, Kenya-Nigeria-Ethiopia</span>
          </div>
          <div className="cg-footer-contact-row">
            <span>🕐</span>
            <span>{t('footer.hours')}</span>
          </div>
        </section>

        {/* ── Column 3: Quick Links ── */}
        <section className="cg-footer-sec">
          <h3 className="cg-footer-h">🔗 {t('footer.linksTitle')}</h3>
          {quickLinks.map(l => (
            <a key={l.label} className="cg-footer-link" href={l.href}>
              {l.label}
            </a>
          ))}
        </section>

        {/* ── Column 4: Tips + Disclaimer ── */}
        <section className="cg-footer-sec">
          <h3 className="cg-footer-h">💡 {t('footer.tipsTitle')}</h3>
          {tips.map((tip, i) => (
            <div key={i} className="cg-footer-tip-row">
              <span className="cg-footer-check">✓</span>
              <span className="cg-footer-text" style={{ opacity: 1 }}>{tip}</span>
            </div>
          ))}
          <div className="cg-footer-disclaimer">
            {t('footer.disclaimer')}
          </div>
        </section>
      </div>

      <p className="cg-footer-bottom">
        © 2026 Agrivoice AI · 
      </p>
    </footer>
  );
};

export default AppFooter;
