export type OutcomeStatus = 'active' | 'paused' | 'complete' | 'abandoned';

export interface OutcomeProgress {
  total_contracts: number;
  completed: number;
  in_progress: number;
  blocked: number;
}

export interface Outcome {
  id: string;
  owner: string;
  description: string;
  contracts: string[];
  status: OutcomeStatus;
  progress: OutcomeProgress;
  satisfaction?: number;
}
