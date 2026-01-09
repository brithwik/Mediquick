
export enum AppTab {
  ADVISOR = 'advisor',
  DRUG_ID = 'drug_id',
  OVERDOSE = 'overdose',
  VOICE = 'voice',
  NEARBY_CARE = 'nearby_care'
}

export interface AnalysisResult {
  text: string;
  groundingSources?: any[];
  imageUrl?: string;
  audioData?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}
