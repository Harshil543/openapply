import type { AIProvider, AIProviderConfig } from '../schemas/ai';
import { GroqProvider } from './providers/groq';
import { LocalProvider } from './providers/local';
import { MockProvider } from './providers/mock';

export function createProvider(config: AIProviderConfig | null): AIProvider {
  if (!config || config.provider === 'mock') {
    return new MockProvider();
  }

  if (config.provider === 'groq' && config.apiKey) {
    return new GroqProvider({
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }

  if (config.provider === 'local' && config.localEndpoint) {
    return new LocalProvider({
      endpoint: config.localEndpoint,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }

  if (config.provider === 'openai-compatible' && config.apiKey && config.baseUrl) {
    return new GroqProvider({
      apiKey: config.apiKey,
      model: config.model || 'gpt-3.5-turbo',
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }

  return new MockProvider();
}
