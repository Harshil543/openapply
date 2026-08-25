import { z } from 'zod';

export const AIRequestSchema = z.object({
  systemPrompt: z.string(),
  userPrompt: z.string(),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().default(1024),
});

export const AIResponseSchema = z.object({
  content: z.string(),
  tokensUsed: z.number().optional(),
});

export const JobAnalysisSchema = z.object({
  match_score: z.number().min(0).max(100),
  matched_skills: z.array(z.string()),
  missing_skills: z.array(z.string()),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  recommendation: z.enum(['apply', 'review', 'skip']),
});

export const QuestionAnswerSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.array(z.enum(['profile', 'resume', 'job_description', 'ai_generated', 'user_provided'])),
  requires_review: z.boolean(),
});

export const AIProviderConfigSchema = z.object({
  provider: z.enum(['groq', 'openai-compatible', 'local', 'mock']),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().default(1024),
  localEndpoint: z.string().optional(),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;
export type QuestionAnswer = z.infer<typeof QuestionAnswerSchema>;
export type AIProviderConfig = z.infer<typeof AIProviderConfigSchema>;

export interface AIProvider {
  generateText(input: { systemPrompt: string; userPrompt: string; temperature?: number; maxTokens?: number }): Promise<AIResponse>;
  analyzeJob(input: { profile: unknown; jobTitle: string; jobDescription: string; skills: string[] }): Promise<JobAnalysis>;
  answerQuestion(input: { question: string; category: string; context: Record<string, unknown> }): Promise<QuestionAnswer>;
}
