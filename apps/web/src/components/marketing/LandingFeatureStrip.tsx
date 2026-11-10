import type { ReactNode } from 'react';

const ITEMS = [
  {
    title: 'Upload Unlimited Photos',
    text: 'Upload photos from any device to the cloud securely.',
    icon: <IconCloudUpload />,
  },
  {
    title: 'Share QR Code',
    text: 'Share your event QR code with your guests.',
    icon: <IconQrShare />,
  },
  {
    title: 'Selfie to Find',
    text: 'Guests take a selfie; AI finds their photos.',
    icon: <IconSelfiePhone />,
  },
  {
    title: 'Get Photos Instantly',
    text: 'Guests instantly view and download their photos.',
    icon: <IconPolaroids />,
  },
  {
    title: 'Secure & Private',
    text: 'Only your guests can access their photos.',
    icon: <IconShieldLock />,
  },
] as const;

export function LandingFeatureStrip() {
  return (
    <div className="landing-feature-strip" aria-label="Key features">
      {ITEMS.map((item, index) => (
        <div
          key={item.title}
          className={`landing-feature-strip-item group ${index < ITEMS.length - 1 ? 'landing-feature-strip-item--divided' : ''}`}
        >
          <div className="landing-feature-icon" aria-hidden>
            {item.icon}
          </div>
          <h5 className="landing-feature-title">{item.title}</h5>
          <p className="landing-feature-text">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

function IconWrap({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 80 80" className="h-[72px] w-[72px]" fill="none" aria-hidden>{children}</svg>;
}

function IconCloudUpload() {
  return (
    <IconWrap>
      <path
        d="M56 52H24a12 12 0 0 1 0-24 16 16 0 0 1 30.4-5.2A10 10 0 0 1 56 52Z"
        stroke="#1d4ed8"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M40 28V46M34 40h12" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 58h16" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </IconWrap>
  );
}

function IconQrShare() {
  const cells = [3, 4, 5, 10, 12, 14, 18, 19, 21, 25, 26, 28, 32, 33, 35, 39, 40, 42, 46, 47, 49];
  return (
    <IconWrap>
      <rect x="18" y="18" width="44" height="44" rx="6" stroke="#1d4ed8" strokeWidth="2.2" />
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4].map((col) => {
          const i = row * 5 + col;
          if (!cells.includes(i)) return null;
          return <rect key={i} x={22 + col * 7.2} y={22 + row * 7.2} width="5.5" height="5.5" rx="1" fill="#2563eb" />;
        }),
      )}
      <rect x="22" y="22" width="14" height="14" rx="2" stroke="#3b82f6" strokeWidth="1.5" />
      <rect x="46" y="46" width="10" height="10" rx="2" fill="#60a5fa" />
    </IconWrap>
  );
}

function IconSelfiePhone() {
  return (
    <IconWrap>
      <rect x="26" y="14" width="28" height="52" rx="6" stroke="#1d4ed8" strokeWidth="2.5" />
      <rect x="30" y="22" width="20" height="32" rx="3" fill="#dbeafe" />
      <circle cx="40" cy="32" r="6" fill="#3b82f6" />
      <path d="M34 40c2 4 10 4 12 0" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="40" cy="58" r="2" fill="#93c5fd" />
      <path d="M18 44h6M56 36h6" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
    </IconWrap>
  );
}

function IconPolaroids() {
  return (
    <IconWrap>
      <rect x="22" y="24" width="28" height="32" rx="3" fill="#eff6ff" stroke="#1d4ed8" strokeWidth="2" transform="rotate(-8 36 40)" />
      <rect x="32" y="20" width="28" height="32" rx="3" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" transform="rotate(6 46 36)" />
      <circle cx="38" cy="30" r="4" fill="#60a5fa" transform="rotate(-8 36 40)" />
      <path d="M28 42l8-6 6 8" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" transform="rotate(-8 36 40)" />
      <circle cx="50" cy="28" r="3.5" fill="#2563eb" transform="rotate(6 46 36)" />
      <path d="M42 38h14M42 44h10" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" transform="rotate(6 46 36)" />
    </IconWrap>
  );
}

function IconShieldLock() {
  return (
    <IconWrap>
      <path
        d="M40 16 22 24v16c0 12 8 20 18 24 10-4 18-12 18-24V24L40 16Z"
        stroke="#1d4ed8"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="34" y="34" width="12" height="14" rx="2" fill="#3b82f6" />
      <path d="M36 34v-3a4 4 0 1 1 8 0v3" stroke="#2563eb" strokeWidth="2" />
      <circle cx="40" cy="40" r="1.5" fill="#eff6ff" />
    </IconWrap>
  );
}
