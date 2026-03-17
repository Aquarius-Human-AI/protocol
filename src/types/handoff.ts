export type HandoffReason =
  | 'capability_boundary'
  | 'confidence_drop'
  | 'autonomy_gate'
  | 'delegation'
  | 'platform_boundary';

export interface HandoffRecord {
  id: string;
  from: string;
  to: string;
  reason: HandoffReason;
  context_transferred: {
    summary: string;
    full_history_ref?: string;
    key_decisions: string[];
  };
  context_lost: string[];
  delegation_chain: string[];
  timestamp: string;
}
