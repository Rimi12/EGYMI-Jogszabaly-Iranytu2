
export interface AnalysisResult {
  rawResponse: string;
  institutionalAnalysis: string;
  faq: Array<{ question: string; answer: string }>;
  actionPoints: Array<{ title: string; description: string; example: string; priority: 'High' | 'Medium' | 'Low' }>;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
