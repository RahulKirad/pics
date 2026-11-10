import { Download, Printer, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface QrCodeModalProps {
  eventId: string;
  eventName: string;
  guestUrl: string;
  open: boolean;
  onClose: () => void;
}

export function QrCodeModal({ eventName, guestUrl, open, onClose }: QrCodeModalProps) {
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(guestUrl)}`;

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=600,height=700');
    if (!w) return;
    w.document.write(`
      <html><head><title>QR - ${eventName}</title></head>
      <body style="font-family:system-ui;text-align:center;padding:32px">
        <h1>${eventName}</h1>
        <img src="${qrImage}" width="280" height="280" alt="QR" />
        <p style="margin-top:16px;font-size:14px;color:#666">${guestUrl}</p>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md rounded-xl border bg-background p-6 shadow-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <motion.h2 layout className="flex items-center gap-2 text-lg font-semibold pr-8">
              <QrCode className="h-5 w-5" />
              Guest QR code
            </motion.h2>
            <p className="mt-1 text-sm text-muted-foreground">Share this link or QR with guests.</p>
            <img src={qrImage} alt="" className="mx-auto mt-4 rounded-lg border bg-white p-3" />
            <p className="mt-3 break-all text-center text-xs text-muted-foreground">{guestUrl}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <a
                href={qrImage}
                download={`${eventName}-qr.png`}
                className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
