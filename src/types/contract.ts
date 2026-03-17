export type ContractState =
  | 'INTENT'
  | 'REQUIREMENTS'
  | 'MATCHING'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'ACTIVE'
  | 'VERIFICATION'
  | 'COMPLETE'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export type PaymentTrigger =
  | 'on_acceptance'
  | 'on_milestone'
  | 'on_completion'
  | 'on_verification';

export type DisputeResolution = 'ai_mediated' | 'human_mediated' | 'platform_deferred';

export type VerificationMethod =
  | 'self_report'
  | 'evidence_based'
  | 'outcome_verified'
  | 'platform_verified';

export type VerificationResult = 'pending' | 'accepted' | 'disputed';

export interface ContractParticipants {
  buyer: string;
  provider: string;
  intermediaries: string[];
}

export interface ContractRequirements {
  description: string;
  acceptance_criteria: string[];
  category: string;
  tags: string[];
  constraints: Record<string, unknown>;
}

export interface ContractTerms {
  pricing: { model: string; amount: number; currency: string };
  timeline: { start?: string; deadline?: string; milestones?: string[] };
  payment_trigger: PaymentTrigger;
  escrow: boolean;
  dispute_resolution: DisputeResolution;
}

export interface StateHistoryEntry {
  state: ContractState;
  timestamp: string;
  triggered_by: string;
  autonomy_gate_result?: 'approved' | 'blocked' | 'auto';
}

export interface ContractVerification {
  method: VerificationMethod;
  evidence: string[];
  result: VerificationResult;
}

export interface WorkContract {
  id: string;
  outcome_id: string;
  participants: ContractParticipants;
  requirements: ContractRequirements;
  terms: ContractTerms;
  state: ContractState;
  state_history: StateHistoryEntry[];
  execution_plan_id?: string;
  verification: ContractVerification;
  revision_count: number;
  max_revisions: number;
}
