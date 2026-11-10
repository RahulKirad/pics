import { QrCode } from 'lucide-react';

const PHOTOS = {
  main: { src: '/hero/photo-2.jpg', alt: 'Wedding couple smiling', label: 'A DAY TO REMEMBER' },
  left: { src: '/hero/photo-1.jpg', alt: 'Guest at an evening celebration', caption: 'THE CELEBRATION' },
  right: { src: '/hero/photo-3.jpg', alt: 'Friends at a wedding reception', caption: 'TOGETHER, ALWAYS' },
} as const;

export function LoginVisualPanel() {
  return (
    <section className="auth-visual-panel" aria-label="PicShareNow event photo showcase">
      <div className="auth-visual-topline">
        <span className="auth-brand-mark">
          PicShare<span>Now</span>
        </span>
        <span className="auth-brand-tag">YOUR EVENT PHOTOS. INSTANTLY.</span>
      </div>

      <div className="auth-visual-copy">
        <p className="auth-visual-eyebrow">One event. Every perspective.</p>
        <h1>
          Every moment
          <br />
          deserves to be <span>shared.</span>
        </h1>
        <p>Bring every guest, every smile and every memory into one beautiful event gallery.</p>
      </div>

      <div className="auth-photo-stage" aria-label="Preview of shared event photographs">
        <figure className="auth-photo auth-photo-back auth-photo-left">
          <img src={PHOTOS.left.src} alt={PHOTOS.left.alt} loading="lazy" decoding="async" />
          <div className="auth-photo-overlay" aria-hidden />
          <figcaption className="auth-photo-caption">
            <span>{PHOTOS.left.caption}</span>
            <i aria-hidden />
          </figcaption>
        </figure>
        <figure className="auth-photo auth-photo-back auth-photo-right">
          <img src={PHOTOS.right.src} alt={PHOTOS.right.alt} loading="lazy" decoding="async" />
          <SecureOverlay />
          <figcaption className="auth-photo-caption">
            <span>{PHOTOS.right.caption}</span>
            <i aria-hidden />
          </figcaption>
        </figure>
        <figure className="auth-photo auth-photo-main">
          <img src={PHOTOS.main.src} alt={PHOTOS.main.alt} loading="eager" decoding="async" />
          <SecureOverlay />
          <span className="auth-photo-label">{PHOTOS.main.label}</span>
        </figure>

        <div className="auth-floating-tag auth-tag-qr">
          <span className="auth-tag-icon">
            <QrCode className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />
          </span>
          <span>
            <b>One QR code</b>
            <small>Photos from everyone</small>
          </span>
        </div>
        <div className="auth-floating-tag auth-tag-match">
          <span className="auth-tag-check" aria-hidden>
            ✓
          </span>
          <span>
            <b>Photo matching</b>
            <small>Find your moments</small>
          </span>
        </div>
      </div>

      <footer className="auth-visual-bottom">
        <div className="auth-bottom-rule" />
        <div className="auth-visual-benefits">
          <span>
            <i aria-hidden /> Easy guest sharing
          </span>
          <span>
            <i aria-hidden /> Private event galleries
          </span>
        </div>
        <div className="auth-visual-note">MADE FOR THE MOMENTS THAT MATTER</div>
      </footer>
    </section>
  );
}

function SecureOverlay() {
  return <div className="auth-photo-overlay" aria-hidden />;
}
