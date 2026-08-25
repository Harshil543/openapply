type MessageHandler<TPayload, TResult> = (payload: TPayload) => Promise<TResult> | TResult;

export type ExtensionMessage =
  | { type: 'GET_PROFILE' }
  | { type: 'SAVE_PROFILE'; payload: import('../schemas/profile').Profile }
  | { type: 'GET_JOBS' }
  | { type: 'SAVE_JOB'; payload: import('../schemas/job').Job }
  | { type: 'GET_SAVED_JOBS' }
  | { type: 'SAVE_SAVED_JOB'; payload: import('../schemas/job').SavedJob }
  | { type: 'REMOVE_SAVED_JOB'; payload: { jobId: string } }
  | { type: 'GET_APPLICATIONS' }
  | { type: 'SAVE_APPLICATION'; payload: import('../schemas/application').Application }
  | { type: 'UPDATE_APPLICATION_STATUS'; payload: { id: string; status: import('../schemas/application').ApplicationStatusType; note?: string } }
  | { type: 'DELETE_APPLICATION'; payload: { id: string } }
  | { type: 'ANALYZE_JOB'; payload: { jobId: string } }
  | { type: 'GET_AI_CONFIG' }
  | { type: 'SAVE_AI_CONFIG'; payload: import('../schemas/ai').AIProviderConfig }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; payload: { schemaVersion: number; minimumMatchScore: number; autoFillSafeFields: boolean; generateAIAnswers: boolean; requireReviewBeforeSubmit: boolean; showConfidence: boolean; localOnlyMode: boolean } }
  | { type: 'EXTRACT_JOB' }
  | { type: 'DETECT_FORM' }
  | { type: 'FILL_FORM'; payload: Record<string, string> }
  | { type: 'EXPORT_DATA' }
  | { type: 'CLEAR_ALL_DATA' };

export type ExtensionResponse =
  | { success: true; data: unknown }
  | { success: false; error: string };

export async function sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message ?? 'Unknown error' });
      } else {
        resolve(response ?? { success: false, error: 'No response' });
      }
    });
  });
}

export type MessageHandlerMap = {
  [K in ExtensionMessage['type']]?: (
    payload: Extract<ExtensionMessage, { type: K }> extends { payload: infer P } ? P : void
  ) => Promise<unknown> | unknown;
};

let handlers: MessageHandlerMap = {};

export function registerHandlers(newHandlers: MessageHandlerMap): void {
  handlers = { ...handlers, ...newHandlers };
}

export function initMessageListener(): void {
  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: ExtensionResponse) => void
    ) => {
      const handler = handlers[message.type];
      if (!handler) {
        sendResponse({ success: false, error: `No handler for ${message.type}` });
        return false;
      }

      const payload = 'payload' in message ? (message as { payload: unknown }).payload : undefined;

      try {
        const result = handler(payload as never);
        if (result instanceof Promise) {
          result
            .then((data) => sendResponse({ success: true, data }))
            .catch((err) => sendResponse({ success: false, error: String(err) }));
          return true;
        }
        sendResponse({ success: true, data: result });
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
      return false;
    }
  );
}
