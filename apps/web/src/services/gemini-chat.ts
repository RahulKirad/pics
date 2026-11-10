export interface SendGeminiChatOptions {
  systemInstruction: string;
  message: string;
  image?: { mimeType: string; base64: string };
  /** Chain multi-turn chats via the Interactions API */
  previousInteractionId?: string | null;
}

export interface SendGeminiChatResult {
  text: string;
  interactionId: string;
}

/** @deprecated Kept for typing only; history is server-side via previous_interaction_id */
export type GeminiChatRole = 'user' | 'model';

export type GeminiTurn = {
  role: GeminiChatRole;
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
};

const INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

/** Preferred default when 3.8 is capacity-limited; override with VITE_GEMINI_MODEL */
const DEFAULT_MODEL = 'gemini-flash-latest';

const MODEL_FALLBACKS = [
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-3.8-flash',
] as const;

const RETRY_DELAYS_MS = [1200, 2500] as const;

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || typeof key !== 'string') {
    throw new Error(
      'Gemini API key is missing. Add VITE_GEMINI_API_KEY to apps/web/.env.local and restart the dev server.',
    );
  }
  return key;
}

function getPrimaryModel(): string {
  const fromEnv = import.meta.env.VITE_GEMINI_MODEL;
  return typeof fromEnv === 'string' && fromEnv.trim() ? fromEnv.trim() : DEFAULT_MODEL;
}

function modelAttemptOrder(primary: string): string[] {
  const ordered = [primary, ...MODEL_FALLBACKS.filter((m) => m !== primary)];
  return [...new Set(ordered)];
}

function buildInput(
  message: string,
  image?: { mimeType: string; base64: string },
): string | Record<string, unknown>[] {
  if (!image) return message;
  return [
    { type: 'text', text: message },
    {
      type: 'image',
      data: image.base64,
      mime_type: image.mimeType,
    },
  ];
}

function isRetriableCapacityError(message: string, httpStatus: number): boolean {
  const lower = message.toLowerCase();
  if (httpStatus === 429 || httpStatus === 503 || httpStatus === 529) return true;
  return (
    lower.includes('high demand') ||
    lower.includes('try again later') ||
    lower.includes('resource exhausted') ||
    lower.includes('overloaded') ||
    lower.includes('capacity')
  );
}

function extractInteractionOutput(payload: unknown): SendGeminiChatResult {
  const root = payload as {
    id?: string;
    status?: string;
    steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
    error?: { message?: string };
  };

  if (root.error?.message) {
    throw new Error(root.error.message);
  }

  if (!root.id) {
    throw new Error('Invalid Gemini response: missing interaction id.');
  }

  if (root.status === 'failed') {
    throw new Error('Gemini could not complete this request. Try again.');
  }

  const outputStep = root.steps?.find((step) => step.type === 'model_output');
  const parts = outputStep?.content ?? [];
  const text = parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('No response from Gemini. Try again or shorten your message.');
  }

  return { text, interactionId: root.id };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function postInteraction(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; message: string }> {
  const response = await fetch(INTERACTIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = data as { error?: { message?: string } };
    return {
      ok: false,
      status: response.status,
      message: err.error?.message ?? `Gemini request failed (${response.status})`,
    };
  }

  return { ok: true, data };
}

function buildRequestBody(
  model: string,
  options: SendGeminiChatOptions,
  usePreviousInteraction: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    input: buildInput(options.message, options.image),
    generation_config: {
      thinking_level: 'medium',
      max_output_tokens: 2048,
    },
  };

  if (usePreviousInteraction && options.previousInteractionId) {
    body.previous_interaction_id = options.previousInteractionId;
  } else {
    body.system_instruction = options.systemInstruction;
  }

  return body;
}

export async function sendGeminiChat(options: SendGeminiChatOptions): Promise<SendGeminiChatResult> {
  const apiKey = getApiKey();
  const models = modelAttemptOrder(getPrimaryModel());
  const canChain = !!options.previousInteractionId;
  let lastError = 'Gemini is busy. Please try again in a moment.';

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex]!;
    const isPrimary = modelIndex === 0;
    const usePreviousInteraction = isPrimary && canChain;

    const body = buildRequestBody(model, options, usePreviousInteraction);

    const maxAttempts = isPrimary ? 1 + RETRY_DELAYS_MS.length : 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 2000);
      }

      const result = await postInteraction(apiKey, body);
      if (result.ok) {
        return extractInteractionOutput(result.data);
      }

      lastError = result.message;
      const retriable = isRetriableCapacityError(result.message, result.status);
      if (!retriable) {
        throw new Error(result.message);
      }

      const retriesLeft = maxAttempts - attempt - 1;
      const moreModels = modelIndex < models.length - 1;
      if (retriesLeft === 0 && !moreModels) break;
      if (retriesLeft === 0) break;
    }
  }

  throw new Error(
    `${lastError} We tried alternate Flash models automatically. Wait a minute and send again.`,
  );
}
