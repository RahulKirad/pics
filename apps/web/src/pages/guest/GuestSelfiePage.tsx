import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ImagePlus, RotateCcw, Upload } from 'lucide-react';
import { SelfieCamera } from '@/components/guest/SelfieCamera';
import { Button } from '@/components/ui/button';
import { guestService } from '@/services/guest';
import { getErrorMessage } from '@/services/api';
import { useGuestStore } from '@/stores/guest-store';

type Step = 'camera' | 'preview' | 'validating';

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

export function GuestSelfiePage() {
  const { eventToken } = useParams<{ eventToken: string }>();
  const navigate = useNavigate();
  const sessionToken = useGuestStore((s) => s.sessionToken);
  const setActiveSearch = useGuestStore((s) => s.setActiveSearch);

  const [step, setStep] = useState<Step>('camera');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationPassed, setValidationPassed] = useState(false);

  const validateMutation = useMutation({
    mutationFn: (payload: { imageBase64: string }) =>
      guestService.validateSelfie(sessionToken!, payload),
    onSuccess: (result) => {
      setValidationPassed(result.passed);
      setValidationMessage(
        result.passed
          ? 'Great! This photo looks good.'
          : result.reason ?? 'Please try again with better lighting.',
      );
      setStep('preview');
    },
    onError: (error) => {
      setValidationPassed(false);
      setValidationMessage(getErrorMessage(error));
      setStep('preview');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { imageBase64: string }) =>
      guestService.submitSelfie(sessionToken!, payload),
    onSuccess: (result) => {
      setActiveSearch(result.searchId);
      navigate(`/e/${eventToken}/processing`);
    },
  });

  const handleCapture = async (blob: Blob) => {
    if (!sessionToken) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    const base64 = await blobToBase64(blob);
    setImageBase64(base64);
    setValidationPassed(false);
    setValidationMessage(null);
    setStep('validating');
    validateMutation.mutate({ imageBase64: base64 });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    await handleCapture(file);
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageBase64(null);
    setValidationMessage(null);
    setValidationPassed(false);
    setStep('camera');
  };

  const handleSubmit = () => {
    if (!imageBase64 || !validationPassed) return;
    submitMutation.mutate({ imageBase64 });
  };

  const isBusy = validateMutation.isPending || submitMutation.isPending;

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white">
      <header className="relative z-20 shrink-0 px-4 py-3 safe-top safe-x">
        <h1 className="text-center text-lg font-semibold">Take a selfie</h1>
        <p className="mt-1 text-center text-sm text-white/60">
          We&apos;ll use this once to find your event photos
        </p>
      </header>

      {step === 'camera' && <SelfieCamera onCapture={handleCapture} disabled={isBusy} />}

      {(step === 'preview' || step === 'validating') && previewUrl && (
        <div className="flex flex-1 flex-col">
          <div className="relative flex-1 overflow-hidden">
            <img src={previewUrl} alt="Selfie preview" className="h-full w-full object-cover" />
            {step === 'validating' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-10 w-10 rounded-full border-2 border-white border-t-transparent"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 bg-background px-4 py-6 text-foreground safe-bottom">
            {validationMessage && (
              <div
                className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
                  validationPassed
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                }`}
              >
                {validationPassed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <span>{validationMessage}</span>
              </div>
            )}

            {submitMutation.isError && (
              <p className="text-sm text-destructive">{getErrorMessage(submitMutation.error)}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={handleRetake} disabled={isBusy}>
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!validationPassed || isBusy}
              >
                {submitMutation.isPending ? 'Submitting…' : 'Find my photos'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'camera' && (
        <div className="border-t border-white/10 bg-black px-4 py-4 safe-bottom">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-sm text-white/80 transition hover:bg-white/5">
            <Upload className="h-4 w-4" />
            Upload a photo instead
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
                e.target.value = '';
              }}
            />
          </label>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-white/50">
            <ImagePlus className="h-3.5 w-3.5" />
            Good lighting and a clear front-facing photo work best
          </p>
        </div>
      )}
    </div>
  );
}
