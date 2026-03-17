export type ParticipantType = 'human' | 'agent' | 'platform';

export type TrustLevel =
  | 'unverified'
  | 'community-verified'
  | 'platform-verified'
  | 'government-verified';

export type AutonomyLevel = 'advisor' | 'facilitator' | 'agent' | 'delegate';

export interface RiskProfile {
  max_auto_commit_value: number;
  max_auto_commit_currency: string;
  restricted_categories: string[];
  approval_rules: Record<string, unknown>;
}

export interface Preferences {
  communication_style?: string;
  language?: string;
  timezone?: string;
  accessibility_needs?: string[];
}

export interface IdentityRecord {
  id: string;
  type: ParticipantType;
  auth: { method: string; verified: boolean };
  trust_level: TrustLevel;
  autonomy_setting: AutonomyLevel;
  delegation_chain: string[];
  preferences: Preferences;
  risk_profile: RiskProfile;
}
