import sharp from 'sharp';

export interface ImageProcessorOptions {
  thumbnailMaxSize?: number;
  previewMaxWidth?: number;
  aiMaxSize?: number;
  jpegQuality?: number;
  watermarkText?: string;
  watermarkOpacity?: number;
}

export interface ProcessedVariants {
  thumbnail: Buffer;
  preview: Buffer;
  watermarked: Buffer;
  aiCopy: Buffer;
  width: number;
  height: number;
}

const DEFAULTS = {
  thumbnailMaxSize: 400,
  previewMaxWidth: 1920,
  aiMaxSize: 2048,
  jpegQuality: 85,
  watermarkOpacity: 0.35,
};

function buildWatermarkSvg(text: string, width: number, height: number, opacity: number): Buffer {
  const fontSize = Math.max(24, Math.round(Math.min(width, height) / 18));
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="wm" width="${width}" height="${height}" patternUnits="userSpaceOnUse">
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
          transform="rotate(-30, ${width / 2}, ${height / 2})"
          font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="600"
          fill="white" fill-opacity="${opacity}">${escaped}</text>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm)" />
  </svg>`;

  return Buffer.from(svg);
}

export async function processImageVariants(
  input: Buffer,
  options: ImageProcessorOptions = {},
): Promise<ProcessedVariants> {
  const thumbnailMaxSize = options.thumbnailMaxSize ?? DEFAULTS.thumbnailMaxSize;
  const previewMaxWidth = options.previewMaxWidth ?? DEFAULTS.previewMaxWidth;
  const aiMaxSize = options.aiMaxSize ?? DEFAULTS.aiMaxSize;
  const jpegQuality = options.jpegQuality ?? DEFAULTS.jpegQuality;
  const watermarkOpacity = options.watermarkOpacity ?? DEFAULTS.watermarkOpacity;

  const metadata = await sharp(input).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  const thumbnail = await sharp(input)
    .rotate()
    .resize(thumbnailMaxSize, thumbnailMaxSize, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: jpegQuality, mozjpeg: true })
    .toBuffer();

  const preview = await sharp(input)
    .rotate()
    .resize(previewMaxWidth, undefined, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: jpegQuality, mozjpeg: true })
    .toBuffer();

  const previewMeta = await sharp(preview).metadata();
  const previewWidth = previewMeta.width ?? width;
  const previewHeight = previewMeta.height ?? height;

  const watermarkText = options.watermarkText?.trim() || 'PhotoFlow';
  const watermarkSvg = buildWatermarkSvg(watermarkText, previewWidth, previewHeight, watermarkOpacity);

  const watermarked = await sharp(preview)
    .composite([{ input: watermarkSvg, blend: 'over' }])
    .jpeg({ quality: jpegQuality, mozjpeg: true })
    .toBuffer();

  const aiCopy = await sharp(input)
    .rotate()
    .resize(aiMaxSize, aiMaxSize, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return {
    thumbnail,
    preview,
    watermarked,
    aiCopy,
    width,
    height,
  };
}
