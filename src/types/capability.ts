export type Modality = 'phone' | 'video' | 'text' | 'in-person' | 'web-automation';

export type PricingModel = 'hourly' | 'fixed' | 'milestone' | 'pay-what-you-want';

export interface Skill {
  name: string;
  category: string;
  proficiency_level: 'novice' | 'intermediate' | 'expert' | 'master';
}

export interface Constraint {
  type: string;
  description: string;
}

export interface PricingRange {
  model: PricingModel;
  min: number;
  max: number;
  currency: string;
}

export interface Performance {
  contracts_completed: number;
  completion_rate: number;
  avg_satisfaction: number;
  dispute_rate: number;
}

export interface CapabilityCard {
  participant_id: string;
  skills: Skill[];
  modalities: Modality[];
  confidence: number;
  constraints: Constraint[];
  availability: {
    schedule?: string;
    timezone: string;
    response_time_estimate?: string;
  };
  pricing: PricingRange;
  performance: Performance;
  version: {
    last_updated: string;
    change_log: string[];
  };
}

export interface MatchCandidate {
  participant_id: string;
  confidence_score: number;
  match_reasoning: string;
  uncertainty_flags: string[];
  estimated_price: number;
  estimated_timeline: string;
}

export interface MatchingRequest {
  requirements: Record<string, unknown>;
  buyer_preferences: Record<string, unknown>;
  constraints: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface MatchingResponse {
  candidates: MatchCandidate[];
  search_exhausted: boolean;
  fallback_suggestions: string[];
}
