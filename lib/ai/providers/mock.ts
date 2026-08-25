import type { AIProvider, AIResponse, JobAnalysis, QuestionAnswer } from '../../schemas/ai';

export class MockProvider implements AIProvider {
  readonly name = 'mock';

  async generateText(input: { systemPrompt: string; userPrompt: string; temperature?: number; maxTokens?: number }): Promise<AIResponse> {
    return {
      content: `[Mock Response] This is a simulated AI response for: ${input.userPrompt.substring(0, 100)}...`,
      tokensUsed: 0,
    };
  }

  async analyzeJob(input: {
    profile: unknown;
    jobTitle: string;
    jobDescription: string;
    skills: string[];
  }): Promise<JobAnalysis> {
    return {
      match_score: 72,
      matched_skills: input.skills.slice(0, 3),
      missing_skills: input.skills.slice(3),
      strengths: ['Relevant title match', 'Good technology overlap'],
      concerns: ['May need more experience in some areas'],
      recommendation: 'review',
    };
  }

  async answerQuestion(input: {
    question: string;
    category: string;
    context: Record<string, unknown>;
  }): Promise<QuestionAnswer> {
    return {
      answer: `[Mock] This is a suggested answer for: ${input.question.substring(0, 80)}...`,
      confidence: 0.5,
      source: ['ai_generated'],
      requires_review: true,
    };
  }
}
