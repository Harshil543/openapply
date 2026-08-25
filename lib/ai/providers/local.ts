import type { AIProvider, AIResponse, JobAnalysis, QuestionAnswer } from '../../schemas/ai';

export class LocalProvider implements AIProvider {
  readonly name = 'local';
  private endpoint: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: { endpoint: string; model?: string; temperature?: number; maxTokens?: number }) {
    this.endpoint = config.endpoint.replace(/\/$/, '');
    this.model = config.model || 'llama3.2';
    this.temperature = config.temperature ?? 0.3;
    this.maxTokens = config.maxTokens ?? 1024;
  }

  private async callAPI(messages: { role: string; content: string }[]): Promise<string> {
    const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Local AI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async generateText(input: { systemPrompt: string; userPrompt: string; temperature?: number; maxTokens?: number }): Promise<AIResponse> {
    const content = await this.callAPI([
      { role: 'system', content: input.systemPrompt },
      { role: 'user', content: input.userPrompt },
    ]);
    return { content, tokensUsed: 0 };
  }

  async analyzeJob(input: {
    profile: unknown;
    jobTitle: string;
    jobDescription: string;
    skills: string[];
  }): Promise<JobAnalysis> {
    const systemPrompt = `You are a job matching assistant. Analyze the job against the user's profile.
Respond ONLY with valid JSON:
{"match_score": <0-100>, "matched_skills": [], "missing_skills": [], "strengths": [], "concerns": [], "recommendation": "apply|review|skip"}`;

    const content = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Profile: ${JSON.stringify(input.profile)}\nJob: ${input.jobTitle}\nDesc: ${input.jobDescription}\nSkills: ${input.skills.join(', ')}` },
    ]);

    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as JobAnalysis;
    } catch {
      return {
        match_score: 50, matched_skills: [], missing_skills: input.skills,
        strengths: [], concerns: ['Could not parse AI response'], recommendation: 'review',
      };
    }
  }

  async answerQuestion(input: {
    question: string;
    category: string;
    context: Record<string, unknown>;
  }): Promise<QuestionAnswer> {
    const systemPrompt = `Answer job application questions. Respond with JSON:
{"answer": "...", "confidence": <0-1>, "source": ["profile"], "requires_review": <bool>}
Never invent facts.`;

    const content = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Q: ${input.question}\nContext: ${JSON.stringify(input.context)}` },
    ]);

    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as QuestionAnswer;
    } catch {
      return {
        answer: 'Please answer this manually.',
        confidence: 0, source: [], requires_review: true,
      };
    }
  }
}
