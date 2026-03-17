import Ajv from 'ajv';

import identitySchema from './identity-record.schema.json' with { type: 'json' };
import contractSchema from './work-contract.schema.json' with { type: 'json' };
import outcomeSchema from './outcome.schema.json' with { type: 'json' };
import capabilitySchema from './capability-card.schema.json' with { type: 'json' };
import executionSchema from './execution-plan.schema.json' with { type: 'json' };
import handoffSchema from './handoff-record.schema.json' with { type: 'json' };

const ajv = new Ajv();

export const validateIdentityRecord = ajv.compile(identitySchema);
export const validateWorkContract = ajv.compile(contractSchema);
export const validateOutcome = ajv.compile(outcomeSchema);
export const validateCapabilityCard = ajv.compile(capabilitySchema);
export const validateExecutionPlan = ajv.compile(executionSchema);
export const validateHandoffRecord = ajv.compile(handoffSchema);
