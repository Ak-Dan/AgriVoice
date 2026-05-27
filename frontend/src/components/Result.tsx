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

const DISEASE_COLOR: Record<string, string> = {
  rust:       '#92400E',
  cercospora: '#374151',
  blight:     '#9A3412',
  healthy:    '#14532D',
};

const Result: React.FC<ResultProps> = ({ result, imageUrl, onBack }) => {
  const { t } = useTranslation();
  const { disease, confidence, severity } = result;
  const [barWidth, setBarWidth] = useState(0);

  // Animate confidence bar on mount
  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(confidence * 100), 150);
    return () => clearTimeout(timer);
  }, [confidence]);

  const sevColor = SEV_COLOR[severity] ?? '#6B7280';
  const sevBg    = SEV_BG[severity]    ?? '#F3F4F6';
  const disColor = DISEASE_COLOR[disease] ?? '#14532D';

  const sevLabel = (() => {
    if (severity === 'low')    return t('severityLow');
    if (severity === 'medium') return t('severityMedium');
    return t('severityHigh');
  })();

  return (
    <section className="result-card">
      {/* Back button */}
      <button className="result-back" onClick={onBack}>
        ← {t('tryAnother')}
      </button>

      <h2 className="result-section-title">📋 {t('result')}</h2>

      {/* Leaf image — centred with confidence badge */}
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

      {/* Disease name — centred */}
      <h3 className="result-disease-name" style={{ color: disColor }}>
        {t(`diseases.${disease}`)}
      </h3>

      {/* Severity badge */}
      <span className="sev-badge" style={{ background: sevBg, color: sevColor }}>
        ⚠ {t('severity')}: {sevLabel}
      </span>

      {/* Confidence bar */}
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

      {/* Description box */}
      <div className="result-description-box">
        <strong>ℹ {t('description')}</strong>
        {t(`diseaseDescriptions.${disease}`)}
      </div>

      {/* Treatment card — centred, prominent */}
      <div className="treat-card">
        <div className="treat-title">
          <span className="treat-icon">💊</span>
          {t('treatment')}
        </div>
        <p className="treat-text">
          {t(`treatments.${disease}`)}
        </p>
      </div>

      {/* Retry button */}
      <div className="retry-wrap">
        <button className="retry-btn" onClick={onBack}>
          {t('tryAnother')}
        </button>
      </div>
    </section>
  );
};

export default Result;
