import rateLimit from 'express-rate-limit';

const rateLimitBody = (message: string) => ({
  success: false as const,
  error: { code: 'RATE_LIMITED', message },
});

export const guestSessionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody('Too many guest session requests. Please try again later.'),
});

export const guestSelfieRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody('Too many selfie attempts. Please wait before trying again.'),
});

export const guestApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody('Too many guest requests. Please slow down.'),
});

export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody('Too many upload requests. Please try again later.'),
});
