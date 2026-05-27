import React from 'react';
import { useTranslation } from 'react-i18next';
import { MAIZE_VIDEO_CATALOG } from '../videos';

interface VideoSectionProps {
  activeDisease: string;
}

const VideoSection: React.FC<VideoSectionProps> = ({ activeDisease }) => {
  const { t } = useTranslation();

  // Look up the video for the current disease.
  // Falls back to 'default' if the key is not found (e.g. before any diagnosis).
  const video =
    MAIZE_VIDEO_CATALOG[activeDisease] ?? MAIZE_VIDEO_CATALOG['default'];

  return (
    <section className="cg-sec-card">
      <h3 className="cg-sec-title">🎬 {t('educationalVideos')}</h3>

      {/* YouTube iframe — fills the card width, 16:9 ratio */}
      <div className="cg-video-frame">
        <iframe
          key={video.src}          /* re-mounts when video changes */
          title={video.title}
          src={video.src}
          width="100%"
          height="100%"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <p className="cg-video-title">{video.title}</p>
      <p className="cg-video-desc">{video.description}</p>
    </section>
  );
};

export default VideoSection;
