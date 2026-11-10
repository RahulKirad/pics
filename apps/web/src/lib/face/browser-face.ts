/** Browser-only face pipeline — embeddings never leave the device except for match RPC input. */

export type FaceEmbedding = number[];

let modelsLoaded = false;
let faceApi: typeof import('@vladmandic/face-api') | null = null;

const MODEL_BASE =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

async function ensureFaceApi() {
  if (faceApi && modelsLoaded) return faceApi;
  faceApi = await import('@vladmandic/face-api');
  await Promise.all([
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

export async function extractPrimaryFaceEmbedding(blob: Blob): Promise<FaceEmbedding> {
  const api = await ensureFaceApi();
  const img = await imageFromBlob(blob);
  const detection = await api
    .detectSingleFace(img, new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection?.descriptor) {
    throw new Error('No clear face found. Use better lighting and face the camera.');
  }

  return Array.from(detection.descriptor);
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
