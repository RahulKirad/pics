/** Browser face pipeline — embeddings stay client-side until match/store RPC. */

export type FaceEmbedding = number[];

let modelsLoaded = false;
let faceApi: typeof import('@vladmandic/face-api') | null = null;

const MODEL_BASE = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

async function ensureFaceApi() {
  if (faceApi && modelsLoaded) return faceApi;
  faceApi = await import('@vladmandic/face-api');
  await Promise.all([
    faceApi.nets.ssdMobilenetv1.loadFromUri(MODEL_BASE),
    faceApi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE),
    faceApi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE),
    faceApi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE),
  ]);
  modelsLoaded = true;
  return faceApi;
}

function imageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image for face detection'));
    };
    img.src = url;
  });
}

/** Applies camera EXIF rotation — fixes many “no face” failures on JPEG uploads. */
async function loadImageForDetection(blob: Blob): Promise<HTMLCanvasElement> {
  try {
    const bitmap = await createImageBitmap(blob, {
      imageOrientation: 'from-image',
    } as ImageBitmapOptions);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas;
  } catch {
    const img = await imageFromBlob(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');
    ctx.drawImage(img, 0, 0);
    return canvas;
  }
}

function scaleForDetection(source: HTMLCanvasElement, maxDim = 1920): HTMLCanvasElement {
  const w = source.width;
  const h = source.height;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  if (scale >= 1) return source;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

type DetectedFace = { embedding: FaceEmbedding; area: number; score: number };

async function detectFaces(
  api: NonNullable<typeof faceApi>,
  input: HTMLCanvasElement,
): Promise<DetectedFace[]> {
  const faces: DetectedFace[] = [];

  const addFrom = (
    detections: Array<{ detection: { box: { width: number; height: number }; score?: number }; descriptor: Float32Array }>,
  ) => {
    for (const d of detections) {
      const box = d.detection.box;
      faces.push({
        embedding: Array.from(d.descriptor),
        area: box.width * box.height,
        score: d.detection.score ?? 0.5,
      });
    }
  };

  const ssd = await api
    .detectAllFaces(input, new api.SsdMobilenetv1Options({ minConfidence: 0.15, maxResults: 50 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  addFrom(ssd);

  if (faces.length === 0) {
    const tinyConfigs: Array<{ inputSize: 416 | 512 | 608; scoreThreshold: number }> = [
      { inputSize: 608, scoreThreshold: 0.25 },
      { inputSize: 512, scoreThreshold: 0.2 },
      { inputSize: 416, scoreThreshold: 0.18 },
    ];
    for (const cfg of tinyConfigs) {
      const tiny = await api
        .detectAllFaces(input, new api.TinyFaceDetectorOptions(cfg))
        .withFaceLandmarks()
        .withFaceDescriptors();
      addFrom(tiny);
      if (faces.length > 0) break;
    }
  }

  return faces;
}

/** All face embeddings found (event photos — group shots, distant faces). */
export async function extractFaceEmbeddingsFromBlob(blob: Blob): Promise<FaceEmbedding[]> {
  const api = await ensureFaceApi();
  const full = await loadImageForDetection(blob);
  const input = scaleForDetection(full);
  const faces = await detectFaces(api, input);
  return faces.map((f) => f.embedding);
}

/** Best single face (guest selfies). */
export async function extractPrimaryFaceEmbedding(blob: Blob): Promise<FaceEmbedding> {
  const api = await ensureFaceApi();
  const full = await loadImageForDetection(blob);
  const input = scaleForDetection(full, 1280);
  const faces = await detectFaces(api, input);
  if (faces.length === 0) {
    throw new Error(
      'We could not see a clear face. Try brighter light, face the camera, and hold the phone at eye level.',
    );
  }
  const best = faces.reduce((a, b) => {
    const scoreA = a.score * 2 + a.area;
    const scoreB = b.score * 2 + b.area;
    return scoreB > scoreA ? b : a;
  });
  return best.embedding;
}

export async function validateSelfieBlob(blob: Blob): Promise<{ passed: boolean; reason: string | null }> {
  try {
    await extractPrimaryFaceEmbedding(blob);
    return { passed: true, reason: null };
  } catch (err) {
    return { passed: false, reason: err instanceof Error ? err.message : 'Face not detected' };
  }
}

export function cosineSimilarity(a: FaceEmbedding, b: FaceEmbedding): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
