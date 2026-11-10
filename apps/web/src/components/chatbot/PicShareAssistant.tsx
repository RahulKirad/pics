import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ImagePlus, Loader2, Send, Sparkles, X } from 'lucide-react';
import { AiAssistantIcon } from '@/components/chatbot/AiAssistantIcon';
import { useAuthStore } from '@/stores/auth-store';
import {
  AUTHENTICATED_ASSISTANT_RULES,
  AUTHENTICATED_SUGGESTIONS,
  PICSHARENOW_KNOWLEDGE,
  PUBLIC_ASSISTANT_RULES,
  PUBLIC_SUGGESTIONS,
} from '@/lib/chatbot-knowledge';
import { sendGeminiChat } from '@/services/gemini-chat';
import {
  fetchAuthenticatedImageBase64,
  readFileAsBase64,
} from '@/services/chatbot-images';
import type { PhotoSummary } from '@photo-platform/shared-types';
import { EventPhotoPicker } from '@/components/chatbot/EventPhotoPicker';
import '@/styles/chatbot.css';

type UiRole = 'user' | 'assistant';

interface UiMessage {
  id: string;
  role: UiRole;
  text: string;
  imagePreview?: string;
}

interface PendingAttachment {
  label: string;
  objectUrl: string;
  mimeType: string;
  base64: string;
  source: 'file' | 'event';
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildSystemPrompt(isAuthenticated: boolean, pathname: string): string {
  const modeRules = isAuthenticated ? AUTHENTICATED_ASSISTANT_RULES : PUBLIC_ASSISTANT_RULES;
  return `${PICSHARENOW_KNOWLEDGE}\n\n${modeRules}\n\nCurrent page path: ${pathname}`;
}

export function PicShareAssistant() {
  const { pathname } = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: isAuthenticated
        ? `Hi${user?.firstName ? ` ${user.firstName}` : ''}! I’m your PicShareNow assistant. Ask about your workflow, or attach an event photo and I’ll analyze it for lighting, composition, and guest-matching readiness.`
        : 'Hi! I’m the PicShareNow assistant. Ask how the product works, request a demo walkthrough, or get help finding pages like Features and FAQ. Sign in to analyze your event photos.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const lastInteractionId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = isAuthenticated ? AUTHENTICATED_SUGGESTIONS : PUBLIC_SUGGESTIONS;

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.id !== 'welcome') return prev;
      return [
        {
          id: 'welcome',
          role: 'assistant',
          text: isAuthenticated
            ? `Hi${user?.firstName ? ` ${user.firstName}` : ''}! I’m your PicShareNow assistant. Ask about your workflow, or attach an event photo and I’ll analyze it for lighting, composition, and guest-matching readiness.`
            : 'Hi! I’m the PicShareNow assistant. Ask how the product works, request a demo walkthrough, or get help finding pages like Features and FAQ. Sign in to analyze your event photos.',
        },
      ];
    });
    lastInteractionId.current = null;
  }, [isAuthenticated, user?.firstName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (attachment?.objectUrl) URL.revokeObjectURL(attachment.objectUrl);
    };
  }, [attachment]);

  const clearAttachment = useCallback(() => {
    setAttachment((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
  }, []);

  const systemInstruction = useMemo(
    () => buildSystemPrompt(isAuthenticated, pathname),
    [isAuthenticated, pathname],
  );

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg: UiMessage = {
      id: uid(),
      role: 'user',
      text: trimmed,
      imagePreview: attachment?.objectUrl,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    const imagePayload = attachment
      ? { mimeType: attachment.mimeType, base64: attachment.base64 }
      : undefined;

    const interactionBefore = lastInteractionId.current;

    try {
      const { text: reply, interactionId } = await sendGeminiChat({
        systemInstruction,
        message: trimmed,
        image: imagePayload,
        previousInteractionId: interactionBefore,
      });

      lastInteractionId.current = interactionId;
      setMessages((m) => [...m, { id: uid(), role: 'assistant', text: reply }]);
      clearAttachment();
    } catch (err) {
      setMessages((m) => m.filter((msg) => msg.id !== userMsg.id));
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (!isAuthenticated) {
      setError('Sign in to analyze images.');
      return;
    }
    try {
      clearAttachment();
      const loaded = await readFileAsBase64(file);
      setAttachment({
        label: file.name,
        objectUrl: loaded.objectUrl,
        mimeType: loaded.mimeType,
        base64: loaded.base64,
        source: 'file',
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read image.');
    }
  };

  const onEventPhoto = async (photo: PhotoSummary) => {
    const url = photo.previewUrl ?? photo.thumbnailUrl;
    if (!url) {
      setError('This photo has no preview yet.');
      return;
    }
    try {
      clearAttachment();
      const loaded = await fetchAuthenticatedImageBase64(url);
      setAttachment({
        label: photo.originalName,
        objectUrl: loaded.objectUrl,
        mimeType: loaded.mimeType,
        base64: loaded.base64,
        source: 'event',
      });
      setPickerOpen(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load photo.');
    }
  };

  if (!open) {
    return <AssistantFab onOpen={() => setOpen(true)} isAuthenticated={isAuthenticated} />;
  }

  return (
    <div className="picshare-assistant">
      <AssistantPanel onClose={() => setOpen(false)}>
        <div className="picshare-assistant-header">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2>PicShareNow Assistant</h2>
              <p>
                {isAuthenticated ? 'Vision + dashboard help' : 'Product guide & demo'}
                {' · '}
                <span className="opacity-80">Powered by Gemini</span>
              </p>
            </div>
            <button
              type="button"
              className="picshare-assistant-icon-btn border-white/30 bg-white/10 text-white"
              onClick={() => setOpen(false)}
              aria-label="Minimize assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="picshare-assistant-chips">
          {suggestions.map((chip) => (
            <button
              key={chip}
              type="button"
              className="picshare-assistant-chip"
              disabled={loading}
              onClick={() => void sendMessage(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="picshare-assistant-messages" ref={scrollRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`picshare-assistant-bubble picshare-assistant-bubble--${msg.role === 'user' ? 'user' : 'bot'}`}
            >
              {msg.text}
              {msg.imagePreview ? (
                <img src={msg.imagePreview} alt="" />
              ) : null}
            </div>
          ))}
          {loading ? (
            <div className="picshare-assistant-typing flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          ) : null}
        </div>

        <div className="picshare-assistant-compose relative">
          {pickerOpen && isAuthenticated ? (
            <EventPhotoPicker onClose={() => setPickerOpen(false)} onSelect={onEventPhoto} />
          ) : null}

          {attachment ? (
            <div className="picshare-assistant-attach-preview">
              <img src={attachment.objectUrl} alt="" />
              <span className="truncate flex-1">{attachment.label}</span>
              <button type="button" className="picshare-assistant-icon-btn" onClick={clearAttachment}>
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="text-xs text-red-600 mb-2" role="alert">
              {error}
            </p>
          ) : null}

          <div className="picshare-assistant-toolbar">
            <button
              type="button"
              className="picshare-assistant-icon-btn"
              disabled={!isAuthenticated || loading}
              title={isAuthenticated ? 'Upload image to analyze' : 'Sign in to analyze images'}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="picshare-assistant-icon-btn"
              disabled={!isAuthenticated || loading}
              title={isAuthenticated ? 'Pick from your events' : 'Sign in to load event photos'}
              onClick={() => setPickerOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onFileChange(e.target.files?.[0])}
            />
          </div>

          <div className="picshare-assistant-input-row">
            <textarea
              className="picshare-assistant-textarea"
              rows={2}
              placeholder={
                isAuthenticated
                  ? 'Ask anything about PicShareNow, or attach a photo to analyze…'
                  : 'Ask about features, pricing, privacy, or request a demo…'
              }
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
            />
            <button
              type="button"
              className="picshare-assistant-send"
              disabled={loading || !input.trim()}
              onClick={() => void sendMessage(input)}
              aria-label="Send message"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </AssistantPanel>
    </div>
  );
}

function AssistantFab({ onOpen, isAuthenticated }: { onOpen: () => void; isAuthenticated: boolean }) {
  const label = isAuthenticated ? 'Open PicShareNow AI assistant' : 'Open PicShareNow assistant';
  return (
    <button
      type="button"
      className="picshare-assistant picshare-assistant-fab"
      onClick={onOpen}
      aria-label={label}
      title={label}
    >
      <AiAssistantIcon className="h-[1.35rem] w-[1.35rem]" />
    </button>
  );
}

function AssistantPanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return <div className="picshare-assistant-panel">{children}</div>;
}
