import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelfieCameraProps {
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
}

export function SelfieCamera({ onCapture, disabled }: SelfieCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported on this device. Use the upload option below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch {
      setError('Camera permission denied. Allow camera access or upload a photo instead.');
    }
  }, [stopStream]);

  useEffect(() => {
    void startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      'image/jpeg',
      0.92,
    );
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-black">
      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-white/80">
          <Camera className="mb-4 h-10 w-10 text-white/50" />
          <p className="text-sm leading-relaxed">{error}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => void startCamera()}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[58vw] max-h-[420px] w-[72vw] max-w-[320px] rounded-[50%] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
          <div className="relative z-10 mt-auto px-4 pb-8 pt-16 text-center safe-bottom">
            <p className="mb-6 text-sm text-white/80">Position your face inside the oval</p>
            <button
              type="button"
              disabled={!isReady || disabled}
              onClick={handleCapture}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 transition enabled:hover:bg-white/30 disabled:opacity-40"
              aria-label="Capture selfie"
            >
              <span className="block h-12 w-12 rounded-full bg-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
