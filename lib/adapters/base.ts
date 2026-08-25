export interface ExtractedJob {
  source: 'linkedin' | 'greenhouse' | 'lever' | 'ashby' | 'workable' | 'manual';
  title: string;
  company: string;
  location: string;
  workMode: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  description: string;
  skills: string[];
  url: string;
  applicationUrl?: string;
  easyApply?: boolean;
  salary?: string;
  employmentType?: string;
  postedAt?: string;
}

export interface JobAdapter {
  readonly source: ExtractedJob['source'];
  canHandle(url: string): boolean;
  extract(): ExtractedJob | null;
}

export type AdapterExtractionResult = {
  success: true;
  job: ExtractedJob;
  adapterVersion: string;
} | {
  success: false;
  error: string;
  adapterVersion: string;
  fallbackUsed?: string;
};

export interface AdapterConfig {
  selectors: Record<string, string[]>;
  fallbacks: Record<string, string>;
}
