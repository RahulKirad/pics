import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Download, Printer, QrCode, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QrCodeSummary } from '@photo-platform/shared-types';
import { Button } from '@/components/ui/button';
import { qrService } from '@/services/qr';
import { getErrorMessage } from '@/services/api';
import { cn } from '@/lib/utils';

interface QrCodeModalProps {
  eventId: string;
  eventName: string;
  open: boolean;
  onClose: () => void;
}

function QrPreview({ qr }: { qr: QrCodeSummary }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const format = qr.hasSvg ? 'svg' : 'png';
  const previewPath = `${qr.previewUrl}?format=${format}`;

  useEffect(() => {
    let active = true;
    let blobUrl: string | null = null;

    qrService.fetchPreviewBlob(previewPath).then((blob) => {
      if (!active) return;
      blobUrl = URL.createObjectURL(blob);
      setObjectUrl(blobUrl);
    });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [previewPath]);

  if (!objectUrl) {
    return <div className="aspect-square w-full max-w-xs mx-auto animate-pulse bg-muted rounded-lg" />;
  }

  if (format === 'svg') {
    return (
      <img
        src={objectUrl}
        alt="Event QR code"
        className="w-full max-w-xs mx-auto rounded-lg border bg-white p-4"
      />
    );
  }

  return (
    <img
      src={objectUrl}
      alt="Event QR code"
      className="w-full max-w-xs mx-auto rounded-lg border bg-white"
    />
  );
}

export function QrCodeModal({ eventId, eventName, open, onClose }: QrCodeModalProps) {
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [branded, setBranded] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['event-qr', eventId],
    queryFn: () => qrService.list(eventId),
    enabled: open,
  });

  const generateMutation = useMutation({
    mutationFn: () => qrService.generate(eventId, { format: 'both', branded }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-qr', eventId] });
    },
  });

  const latestQr = data?.items[0];

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${eventName}</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 32px;">
          ${printRef.current.innerHTML}
          <p style="margin-top: 16px; font-size: 14px; color: #666;">${data?.guestUrl ?? ''}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-4 top-[10vh] z-50 mx-auto max-w-lg rounded-xl border bg-background shadow-lg md:inset-x-auto"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                <h2 className="font-semibold">Event QR Code</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                Guests scan this code to open the event gallery on their phone.
              </p>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={branded}
                  onChange={(e) => setBranded(e.target.checked)}
                  className="rounded border"
                />
                Include event name (branded)
              </label>

              <div ref={printRef}>
                {isLoading ? (
                  <div className="aspect-square max-w-xs mx-auto animate-pulse bg-muted rounded-lg" />
                ) : latestQr ? (
                  <QrPreview qr={latestQr} />
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No QR code yet. Generate one below.
                  </div>
                )}
              </div>

              {data?.guestUrl && (
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-xs font-mono break-all">
                  {data.guestUrl}
                </div>
              )}

              {generateMutation.isError && (
                <p className="text-sm text-destructive">{getErrorMessage(generateMutation.error)}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t p-4">
              <Button
                className="flex-1"
                disabled={generateMutation.isPending}
                onClick={() => generateMutation.mutate()}
              >
                <RefreshCw className={cn(generateMutation.isPending && 'animate-spin')} />
                {latestQr ? 'Regenerate' : 'Generate'}
              </Button>
              {latestQr?.downloadPngUrl && (
                <Button
                  variant="outline"
                  onClick={() => qrService.download(latestQr.downloadPngUrl!, 'event-qr.png')}
                >
                  <Download className="h-4 w-4" />
                  PNG
                </Button>
              )}
              {latestQr?.downloadSvgUrl && (
                <Button
                  variant="outline"
                  onClick={() => qrService.download(latestQr.downloadSvgUrl!, 'event-qr.svg')}
                >
                  <Download className="h-4 w-4" />
                  SVG
                </Button>
              )}
              {latestQr && (
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
