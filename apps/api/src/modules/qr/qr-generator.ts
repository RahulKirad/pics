import QRCode from 'qrcode';

export interface QrGenerateOptions {
  branded?: boolean;
  label?: string;
  brandColor?: string;
  size?: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractSvgInner(svg: string): string {
  const match = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match?.[1]?.trim() ?? svg;
}

export function wrapBrandedSvg(qrSvg: string, label: string, size = 400): string {
  const inner = extractSvgInner(qrSvg);
  const labelHeight = 56;
  const totalHeight = size + labelHeight;
  const escaped = escapeXml(label);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${totalHeight}" viewBox="0 0 ${size} ${totalHeight}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g transform="translate(0, 0)">${inner}</g>
  <text x="${size / 2}" y="${size + 36}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600" fill="#111827">${escaped}</text>
</svg>`;
}

export async function generateQrPng(url: string, options: QrGenerateOptions = {}): Promise<Buffer> {
  const size = options.size ?? 512;
  return QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'H',
    margin: 2,
    width: size,
    color: {
      dark: options.brandColor ?? '#111827',
      light: '#FFFFFF',
    },
  });
}

export async function generateQrSvg(url: string, options: QrGenerateOptions = {}): Promise<string> {
  const size = options.size ?? 400;
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    width: size,
    color: {
      dark: options.brandColor ?? '#111827',
      light: '#FFFFFF',
    },
  });

  if (options.branded && options.label) {
    return wrapBrandedSvg(svg, options.label, size);
  }

  return svg;
}
