import type { AIProvider, AIResponse, JobAnalysis, QuestionAnswer } from '../../schemas/ai';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqProvider implements AIProvider {
  readonly name = 'groq';
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: { apiKey: string; model?: string; temperature?: number; maxTokens?: number }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'llama-3.1-8b-instant';
    this.temperature = config.temperature ?? 0.3;
    this.maxTokens = config.maxTokens ?? 1024;
  }

  private async callAPI(messages: { role: string; content: string }[]): Promise<string> {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
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
    const profileStr = JSON.stringify(input.profile);
    const systemPrompt = `You are a job matching assistant. Analyze the job against the user's profile.
Respond ONLY with valid JSON matching this exact schema:
{
  "match_score": <number 0-100>,
  "matched_skills": [<string>],
  "missing_skills": [<string>],
  "strengths": [<string>],
  "concerns": [<string>],
  "recommendation": "apply" | "review" | "skip"
}
Do not include any text outside the JSON.`;

    const userPrompt = `User Profile: ${profileStr}

Job Title: ${input.jobTitle}
Job Description: ${input.jobDescription}
Required Skills: ${input.skills.join(', ')}

Analyze this job match and provide a JSON response.`;

    const content = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as JobAnalysis;
    } catch {
      return {
        match_score: 50,
        matched_skills: [],
        missing_skills: input.skills,
        strengths: [],
        concerns: ['AI response could not be parsed'],
        recommendation: 'review',
      };
    }
  }

  async answerQuestion(input: {
    question: string;
    category: string;
    context: Record<string, unknown>;
  }): Promise<QuestionAnswer> {
    const systemPrompt = `You are an application answer assistant. Generate answers for job application questions.
Respond ONLY with valid JSON matching this exact schema:
{
  "answer": "<string>",
  "confidence": <number 0-1>,
  "source": [<"profile" | "resume" | "job_description" | "ai_generated" | "user_provided">],
  "requires_review": <boolean>
}
Rules:
- Never invent employment history, degrees, certifications, or years of experience.
- If you cannot answer accurately from the provided context, set requires_review to true and confidence below 0.5.
- Always mark AI-generated answers with requires_review: true.`;

    const userPrompt = `Question Category: ${input.category}
Question: ${input.question}
Context: ${JSON.stringify(input.context)}

Generate an appropriate answer.`;

    const content = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as QuestionAnswer;
    } catch {
      return {
        answer: 'Unable to generate answer. Please provide this manually.',
        confidence: 0,
        source: [],
        requires_review: true,
      };
    }
  }
}
