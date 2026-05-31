import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DiagnosisResult } from '../types';

interface ResultProps {
  result: DiagnosisResult;
  imageUrl?: string;
  onBack: () => void;
}

const SEV_COLOR: Record<string, string> = {
  low:    '#15803D',
  medium: '#D97706',
  high:   '#DC2626',
};

const SEV_BG: Record<string, string> = {
  low:    '#DCFCE7',
  medium: '#FEF3C7',
  high:   '#FEE2E2',
};

const Result: React.FC<ResultProps> = ({ result, imageUrl, onBack }) => {
  const { t } = useTranslation();
  const { disease, confidence, severity, recognized } = result;
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(confidence * 100), 150);
    return () => clearTimeout(timer);
  }, [confidence]);

  // Colour is driven by severity (works for all 38 classes), not a per-disease map.
  const sevColor = SEV_COLOR[severity] ?? '#6B7280';
  const sevBg    = SEV_BG[severity]    ?? '#F3F4F6';

  // Resolve display text via i18n. For recognised non-maize labels the key is the
  // raw label; i18n falls back to English under SW. Unknown -> dedicated key.
  const nameText        = t(`diseases.${disease}`);
  const descriptionText = t(`diseaseDescriptions.${disease}`);
  const treatmentText   = t(`treatments.${disease}`);

  const sevLabel = (() => {
    if (severity === 'low')    return t('severityLow');
    if (severity === 'medium') return t('severityMedium');
    return t('severityHigh');
  })();

  return (
    <section className="result-card">
      <button className="result-back" onClick={onBack}>
        ← {t('tryAnother')}
      </button>

      <h2 className="result-section-title">📋 {t('result')}</h2>

      <div className="result-img-wrap">
        {imageUrl ? (
          <img className="result-img" src={imageUrl} alt="Diagnosed leaf" />
        ) : (
          <div className="result-img" style={{
            background: '#f0fdf4', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem',
          }}>
            🌿
          </div>
        )}
        <span className="conf-badge" style={{ background: sevColor }}>
          {t('confidence')}: {Math.round(confidence * 100)}%
        </span>
      </div>

      {/* Disease name (severity-coloured) */}
      <h3 className="result-disease-name" style={{ color: sevColor }}>
        {nameText}
      </h3>

      {/* Low-confidence hedge — important for a tool people act on */}
      {recognized && confidence < 0.5 && (
        <p className="result-lowconf-note" style={{ color: '#B45309', textAlign: 'center', fontSize: '0.9rem', margin: '0 0 8px' }}>
          ⚠ {t('lowConfidenceNote')}
        </p>
      )}

      <span className="sev-badge" style={{ background: sevBg, color: sevColor }}>
        ⚠ {t('severity')}: {sevLabel}
      </span>

      <div className="conf-row">
        <div className="conf-labels">
          <span>{t('confidence')}</span>
          <span style={{ fontWeight: 700, color: sevColor }}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="conf-bar-track">
          <div
            className="conf-bar-fill"
            style={{ width: `${barWidth}%`, background: sevColor }}
          />
        </div>
      </div>

      <div className="result-description-box">
        <strong>ℹ {t('description')}</strong>
        {descriptionText}
      </div>

      <div className="treat-card">
        <div className="treat-title">
          <span className="treat-icon">💊</span>
          {t('treatment')}
        </div>
        <p className="treat-text">
          {treatmentText}
        </p>
      </div>

      <div className="retry-wrap">
        <button className="retry-btn" onClick={onBack}>
          {t('tryAnother')}
        </button>
      </div>
    </section>
  );
};

export default Result;
