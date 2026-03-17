import type { WorkContract, ContractState, StateHistoryEntry } from '../types/contract.js';
import { isTerminalState, isValidTransition } from './states.js';

export class ContractStateMachine {
  static transition(
    contract: WorkContract,
    to: ContractState,
    triggered_by: string,
  ): WorkContract {
    const from = contract.state;

    if (isTerminalState(from)) {
      throw new Error(`Cannot transition from terminal state: ${from}`);
    }

    if (!isValidTransition(from, to)) {
      throw new Error(`Invalid transition: ${from} → ${to}`);
    }

    // Revision loop guard
    if (from === 'VERIFICATION' && to === 'ACTIVE') {
      if (contract.revision_count >= contract.max_revisions) {
        throw new Error(
          `Max revisions reached (${contract.max_revisions}). Cannot revise further.`,
        );
      }
    }

    const historyEntry: StateHistoryEntry = {
      state: to,
      timestamp: new Date().toISOString(),
      triggered_by,
      autonomy_gate_result: 'auto',
    };

    return {
      ...contract,
      state: to,
      state_history: [...contract.state_history, historyEntry],
      revision_count:
        from === 'VERIFICATION' && to === 'ACTIVE'
          ? contract.revision_count + 1
          : contract.revision_count,
    };
  }
}
