export enum AppMode {
  GENERATOR = 'GENERATOR',
  ANALYZER = 'ANALYZER',
}

export interface PromptConfig {
  role: string;
  task: string;
  goal: string;
  strategy: string;
  framework: string;
  tags: string;
  format: string;
}

export interface SavedPromptConfig {
  id: string;
  name: string;
  config: PromptConfig;
  lastUpdated: number;
}

export interface GeneratedNote {
  title: string;
  content: string;
  tags: string[];
  emoji: string;
}

export interface SavedDraft {
  id: string;
  note: GeneratedNote;
  createdAt: number;
  source: 'analyzer' | 'generator';
}

export interface AnalysisResult {
  titleAnalysis: string;
  frameworkAnalysis: string;
  keywords: string[];
  tags: string[];
  viralScore: number;
  tagsAnalysis: string;
}

export interface AnalyzerState {
  content: string; // Since we can't scrape client-side, user pastes content
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  targetCount: number;
  generatedVariations: GeneratedNote[];
  isGenerating: boolean;
}