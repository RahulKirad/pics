import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { guestService } from '@/services/guest';
import { getErrorMessage } from '@/services/api';
import { useGuestStore } from '@/stores/guest-store';

const CONSENT_POINTS = [
  'We use your selfie only to find photos of you in this event gallery.',
  'Face data is processed securely and is not sold or shared with third parties.',
  'Your selfie may be stored temporarily for this search session and then removed per event policy.',
  'You can close this page at any time — no account is created.',
];

export function GuestConsentPage() {
  const { eventToken } = useParams<{ eventToken: string }>();
  const navigate = useNavigate();
  const sessionToken = useGuestStore((s) => s.sessionToken);
  const setConsent = useGuestStore((s) => s.setConsent);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consentMutation = useMutation({
    mutationFn: () => guestService.recordConsent(sessionToken!),
    onSuccess: (result) => {
      setConsent(result.consentVersion);
      navigate(`/e/${eventToken}/selfie`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleAccept = () => {
    if (!accepted || !sessionToken) return;
    setError(null);
    consentMutation.mutate();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col page-x py-4 sm:py-6">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Privacy & consent</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Before we open the camera, please review how your data is used for photo matching.
          </p>

          <ul className="space-y-4 mb-8">
            {CONSENT_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <label className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span className="text-sm leading-relaxed">
              I understand and agree to the use of my selfie for face matching in this event only.
            </span>
          </label>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </motion.div>

        <div className="sticky bottom-0 bg-background pt-6 pb-2 safe-bottom">
          <Button
            className="w-full h-12 text-base"
            disabled={!accepted || consentMutation.isPending}
            onClick={handleAccept}
          >
            {consentMutation.isPending ? 'Saving…' : 'Accept & continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
