let devMode = false;

export function setDevMode(enabled: boolean): void {
  devMode = enabled;
}

export function logAdapterFailure(adapter: string, url: string, reason: string): void {
  if (!devMode) return;
  console.warn(
    `[OpenApply] Adapter "${adapter}" failed to extract from ${url}: ${reason}`
  );
}

export function logAdapterSuccess(adapter: string, url: string, title: string, company: string): void {
  if (!devMode) return;
  console.log(
    `[OpenApply] Adapter "${adapter}" extracted "${title}" at "${company}" from ${url}`
  );
}

export function logContentScript(event: string, detail?: string): void {
  if (!devMode) return;
  console.log(
    `[OpenApply] Content script: ${event}${detail ? ` — ${detail}` : ''}`
  );
}
