export class OpenApplyError extends Error {
  code: string;
  context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'OpenApplyError';
    this.code = code;
    this.context = context;
  }
}

export function handleError(error: unknown, fallbackMessage = 'An unexpected error occurred'): OpenApplyError {
  if (error instanceof OpenApplyError) return error;

  if (error instanceof Error) {
    return new OpenApplyError(error.message, 'UNKNOWN_ERROR', { originalError: error.name });
  }

  return new OpenApplyError(fallbackMessage, 'UNKNOWN_ERROR', { raw: String(error) });
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenApplyError) {
    return ['NETWORK_ERROR', 'RATE_LIMITED', 'TIMEOUT'].includes(error.code);
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') || msg.includes('timeout') || msg.includes('rate limit');
  }
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && isRetryableError(error)) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw handleError(lastError);
}

export function logError(error: unknown, source: string): void {
  const handled = handleError(error);
  console.error(`[OpenApply Error] ${source}:`, handled.code, handled.message, handled.context);
}
