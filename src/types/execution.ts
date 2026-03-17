export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'complete' | 'failed';

export interface HandoffPolicy {
  trigger: string;
  escalation_path: string[];
}

export interface ExecutionTask {
  id: string;
  description: string;
  assigned_to: string;
  status: TaskStatus;
  blocked_by: string[];
  handoff_policy: HandoffPolicy;
  evidence: string[];
}

export interface ExecutionPlan {
  id: string;
  contract_id: string;
  tasks: ExecutionTask[];
  handoff_log: string[];
}
