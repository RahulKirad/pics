import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle, FileImage, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadsService } from '@/services/uploads';
import { validateImageFile } from '@/lib/upload-utils';
import { getErrorMessage } from '@/services/api';
import { cn } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'duplicate' | 'failed';
  error?: string;
}

interface UploadDrawerProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function UploadDrawer({ eventId, open, onClose, onComplete }: UploadDrawerProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const processQueue = useCallback(async (queue: UploadFile[]) => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;

    for (const item of queue) {
      if (item.status !== 'pending') continue;
      updateFile(item.id, { status: 'uploading', progress: 0 });

      try {
        const result = await uploadsService.uploadFile(
          item.file,
          eventId,
          (progress) => updateFile(item.id, { progress }),
        );

        if (result.duplicate) {
          updateFile(item.id, { status: 'duplicate', progress: 100 });
        } else {
          updateFile(item.id, { status: 'completed', progress: 100 });
        }
      } catch (err) {
        updateFile(item.id, {
          status: 'failed',
          error: getErrorMessage(err),
        });
      }
    }

    uploadingRef.current = false;
    onComplete?.();
  }, [eventId, onComplete]);

  const retryFile = (item: UploadFile) => {
    const retryItem = { ...item, status: 'pending' as const, progress: 0, error: undefined };
    updateFile(item.id, { status: 'pending', progress: 0, error: undefined });
    processQueue([retryItem]);
  };

  const addFiles = (fileList: FileList | File[]) => {
    const newFiles: UploadFile[] = [];
    for (const file of Array.from(fileList)) {
      const error = validateImageFile(file);
      if (error) continue;
      newFiles.push({
        id: `${file.name}-${file.size}-${Date.now()}`,
        file,
        progress: 0,
        status: 'pending',
      });
    }
    if (newFiles.length === 0) return;
    setFiles((prev) => [...prev, ...newFiles]);
    processQueue(newFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const completedCount = files.filter((f) => f.status === 'completed' || f.status === 'duplicate').length;
  const failedCount = files.filter((f) => f.status === 'failed').length;

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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-xl border bg-background shadow-lg safe-bottom"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="font-semibold">Upload Photos</h2>
                {files.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {completedCount} completed{failedCount > 0 ? `, ${failedCount} failed` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
                aria-label="Close upload"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(85vh - 120px)' }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
                  isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                )}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop photos here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP up to 50MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 rounded-md border p-3">
                      <FileImage className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.file.name}</p>
                        {item.status === 'uploading' && (
                          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                        {item.status === 'duplicate' && (
                          <p className="text-xs text-warning mt-0.5">Already uploaded</p>
                        )}
                        {item.status === 'failed' && item.error && (
                          <p className="text-xs text-destructive mt-0.5">{item.error}</p>
                        )}
                        {item.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => retryFile(item)}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                          </button>
                        )}
                      </div>
                      {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                      {item.status === 'duplicate' && <CheckCircle className="h-4 w-4 text-warning shrink-0" />}
                      {item.status === 'failed' && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t p-4">
              <Button variant="outline" className="w-full" onClick={onClose}>
                {uploadingRef.current ? 'Upload in progress...' : 'Done'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
