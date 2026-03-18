# Layer F — Buyer & Worker Control Surface: Implementation Spec

**Version:** 1.0
**Date:** 2026-03-18
**Status:** Approved for implementation
**Dependencies:** SPEC-LAYER-A.md, SPEC-LAYER-B.md, SPEC-LAYER-C.md, SPEC-LAYER-D.md, SPEC-LAYER-E.md, ADR-003

---

## 1. Purpose

Layer F is the unified control surface for all human participants in the Programmable Labor Network — buyers, workers, and unclaimed profiles. It renders real-time execution state, exposes approval gates, collects feedback, and provides the conversational intake experience. The same application serves both roles; content, layout, and available actions adapt based on the user's context.

Layer F is an **interface layer** — it does not own business logic. All decisions, state transitions, and evaluations happen in Layers A–E. Layer F consumes their APIs and event streams, presents information, and relays user actions back to the appropriate layer.

---

## 2. Scope

### In Scope (v1)

- **Unified surface**: Single responsive web app serving buyers and workers, role-differentiated by content
- **Conversational intake**: Chat interface for outcome negotiation (Layer A), powered by OpenAI Agents SDK UI with heavy customization
- **Three-tier execution view**: Roadmap (phase bars + %) → DAG (task graph) → Detail (per-task event panel)
- **Approval gates**: Execution plan approval, task negotiation approval, dispute resolution, amendment acceptance, verification of completed work
- **Buyer steering**: Task comments, provider requests, free-text feedback
- **Worker task management**: View assigned tasks, accept/decline assignments, submit deliverables, view reputation
- **Profile claiming**: Onboarding flow for workers discovered via web crawl (Layer C)
- **Real-time updates**: SSE consumption from Layer D with `last_event_id` reconnection
- **Notifications**: In-app notifications for all event importance levels
- **Payment placeholders**: Payment section toggled by environment flag, hidden when off
- **Generative UI**: Server-driven UI elements where the backend determines component rendering based on context
- **Authentication**: Azure AD B2C for identity management
- **Storage**: Cosmos DB for UI state, preferences, and notification state

### Out of Scope (v1)

- Native mobile apps (responsive web covers mobile)
- Admin/operator tooling
- Delegation chains (single identity per account)
- SMS/email notification channels (in-app only)
- Payment processing (placeholders only)
- Worker bidding/marketplace browsing (matching is system-driven)
- Buyer reputation display (data collection only per Layer E)

---

## 3. Tech Stack

```
Framework:         Vite 6.x + React 19 + TypeScript
Routing:           React Router DOM 7.x (SPA, client-side routing)
Component Library: Mantine 8.x (@mantine/core, @mantine/hooks, @mantine/notifications)
Icons:             Tabler Icons React
Chat UI:           @openai/agents-ui (OpenAI Agents SDK React components), heavily customized
State Management:  TanStack Query (server state) + Zustand (client state)
SSE:               ReadableStream API with manual event parsing (not EventSource)
Auth:              Azure AD B2C via @azure/msal-browser + @azure/msal-react
Charting/DAG:      React Flow (DAG visualization), Mantine Progress (roadmap bars)
Rich Text:         BlockNote (for task comments and deliverable submissions)
Testing:           Vitest (unit/integration) + Playwright (E2E) + MSW (API mocking)
Build:             Vite with manual chunk splitting
API Types:         Auto-generated TypeScript from OpenAPI spec
```

### Why TanStack Query + Zustand

TanStack Query handles server state — caching, refetching, optimistic updates, and SSE integration. This is the right tool for Layer F's primary job: rendering remote state from Layers A–E. Zustand handles local UI state (active view tier, panel collapse state, notification preferences) without the boilerplate of Context + useReducer. This split keeps server and client state cleanly separated.

---

## 4. Authentication

### 4.1 Azure AD B2C

All users (buyers and workers) authenticate through Azure AD B2C. This provides:

- Email/password sign-up and sign-in
- Social identity providers (Google, Microsoft, Apple) — configurable per tenant
- Self-service password reset
- MFA (optional, configurable)
- Token management (access tokens, refresh tokens, ID tokens)

```python
# Environment variables
AZURE_AD_B2C_TENANT="{tenant}.onmicrosoft.com"
AZURE_AD_B2C_CLIENT_ID="{client-id}"
AZURE_AD_B2C_AUTHORITY="https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}"
AZURE_AD_B2C_REDIRECT_URI="https://app.awp.com"
AZURE_AD_B2C_SCOPES="openid,profile,email,offline_access"
```

### 4.2 Frontend Auth Flow

```typescript
// src/auth/msalConfig.ts
import { PublicClientApplication, Configuration } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_B2C_CLIENT_ID,
    authority: import.meta.env.VITE_AZURE_AD_B2C_AUTHORITY,
    redirectUri: import.meta.env.VITE_AZURE_AD_B2C_REDIRECT_URI,
    knownAuthorities: [`${import.meta.env.VITE_AZURE_AD_B2C_TENANT}.b2clogin.com`],
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
```

### 4.3 Identity Mapping

On first sign-in, the frontend calls Layer C's identity API to create or retrieve an `IdentityRecord`. The Azure AD B2C `oid` (object ID) is stored as an external identity reference on the `IdentityRecord`. All subsequent API calls include the `IdentityRecord.id` (not the Azure AD `oid`) as the authenticated user identifier.

```typescript
// After successful B2C login
const identityRecord = await identityService.getOrCreate({
  external_provider: "azure_ad_b2c",
  external_id: account.localAccountId,
  email: account.username,
  display_name: account.name,
});
// identityRecord.id is used for all API calls
```

### 4.4 Dual Role — No Role Switching

A single account is both a buyer and a worker simultaneously. There is no "role switch" toggle. The dashboard shows "My Outcomes" (buyer context) and "My Tasks" (worker context) side by side. The user's `IdentityRecord` in Layer C serves both roles — they may be a `participants.buyer_id` on some contracts and an `assigned_provider_id` on tasks in other contracts.

---

## 5. Application Structure

### 5.1 Route Map

```
/                          → Dashboard (My Outcomes + My Tasks)
/login                     → Azure AD B2C sign-in
/claim/:invite_code        → Profile claiming flow for crawl-discovered workers
/outcomes/new              → Intake conversation (new outcome)
/outcomes/:id              → Outcome detail (three-tier view)
/outcomes/:id/chat         → Resume intake conversation
/tasks/:id                 → Task detail (worker view — accept, submit, communicate)
/reputation                → My reputation scores (worker view)
/settings                  → Notification preferences, payment config, account
/notifications             → Full notification history
```

### 5.2 Folder Structure

```
src/
├── main.tsx                    # App entry with MsalProvider + routing
├── App.tsx                     # Authenticated app shell
├── auth/
│   ├── msalConfig.ts           # Azure AD B2C configuration
│   └── AuthGuard.tsx           # Route protection component
├── components/
│   ├── chat/                   # Intake conversation UI (@openai/agents-ui wrappers)
│   │   ├── IntakeChat.tsx      # Main chat component with SDK integration
│   │   ├── CriteriaProposal.tsx # Custom render for proposed acceptance criteria
│   │   ├── PricingEstimate.tsx # Custom render for pricing estimates
│   │   └── InterruptBanner.tsx # Shows when agent is waiting for buyer input
│   ├── dashboard/
│   │   ├── Dashboard.tsx       # Main dashboard layout
│   │   ├── OutcomeList.tsx     # Buyer's active outcomes
│   │   ├── TaskList.tsx        # Worker's assigned tasks
│   │   └── NotificationBell.tsx
│   ├── outcome/
│   │   ├── OutcomeDetail.tsx   # Container for three-tier view
│   │   ├── RoadmapView.tsx     # Tier 1: phase bars + percentage
│   │   ├── DagView.tsx         # Tier 2: full task DAG (React Flow)
│   │   ├── TaskDetailPanel.tsx # Tier 3: per-task event log + actions
│   │   ├── ApprovalGate.tsx    # Approval prompt component
│   │   ├── DisputePanel.tsx    # Dispute resolution UI
│   │   └── CostTracker.tsx     # Running cost vs budget
│   ├── task/
│   │   ├── TaskWorkerView.tsx  # Worker's view of an assigned task
│   │   ├── DeliverableSubmission.tsx  # Free-text + structured submission
│   │   ├── TaskComments.tsx    # Buyer/worker comment thread
│   │   └── ClarificationThread.tsx   # Buyer asks, worker responds
│   ├── profile/
│   │   ├── ClaimProfile.tsx    # Onboarding for crawl-discovered workers
│   │   ├── ReputationView.tsx  # Worker's reputation scores
│   │   └── SettingsPanel.tsx   # Preferences, payment config
│   ├── payment/
│   │   └── PaymentPlaceholder.tsx  # Gated by VITE_PAYMENTS_ENABLED flag
│   ├── generative/
│   │   ├── GenerativeRenderer.tsx  # Server-driven UI component router
│   │   └── components/         # Registry of generative-renderable components
│   └── shared/
│       ├── EventStream.tsx     # SSE connection manager component
│       ├── LoadingStates.tsx   # Skeleton loaders per view type
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useEventStream.ts       # SSE connection with last_event_id reconnection
│   ├── useOutcome.ts           # Outcome data + mutations (TanStack Query)
│   ├── useExecutionPlan.ts     # Plan data + approval mutations
│   ├── useTasks.ts             # Task list for worker view
│   ├── useNotifications.ts     # In-app notification state
│   ├── useApprovalGate.ts      # Pending approvals for current user
│   ├── useReputation.ts        # Worker reputation scores
│   └── useGenerativeUI.ts      # Fetches server-driven UI definitions
├── services/
│   ├── outcomeService.ts       # Layer A API calls
│   ├── planService.ts          # Layer B API calls
│   ├── identityService.ts      # Layer C identity API calls
│   ├── matchingService.ts      # Layer C matching API calls (provider requests)
│   ├── executionService.ts     # Layer D API calls
│   ├── reputationService.ts    # Layer E API calls
│   ├── eventStreamService.ts   # SSE connection management
│   ├── notificationService.ts  # Notification state management
│   └── types.ts                # Auto-generated from OpenAPI
├── stores/
│   ├── uiStore.ts              # Zustand: active view, panel state, filters
│   └── notificationStore.ts    # Zustand: unread count, notification queue
├── types/
│   ├── api.generated.ts        # Auto-generated TypeScript from OpenAPI spec
│   └── ui.ts                   # Frontend-only types
├── utils/
│   ├── eventParser.ts          # SSE line-by-line parser
│   ├── costFormatter.ts        # Currency display formatting
│   ├── timeFormatter.ts        # Duration and deadline formatting
│   └── dagLayout.ts            # DAG layout computation for React Flow
├── constants/
│   └── config.ts               # Feature flags, defaults
├── mocks/
│   ├── handlers/               # MSW request handlers per layer
│   ├── data/                   # Mock response data
│   ├── browser.ts              # MSW browser worker
│   └── server.ts               # MSW Node server (tests)
└── test/
    ├── setup.ts                # Vitest setup
    └── fixtures/               # Test workers, outcomes, plans
```

---

## 6. Conversational Intake (Chat Interface)

### 6.1 OpenAI Agents SDK UI Integration

The intake conversation uses `@openai/agents-ui` React components as the rendering layer for the Layer A intake agent. The SDK provides message streaming, tool call visualization, and interrupt state handling.

```typescript
// src/components/chat/IntakeChat.tsx
import { AgentChat } from "@openai/agents-ui";
import { useIntakeSession } from "../../hooks/useIntakeSession";

interface IntakeChatProps {
  outcomeId?: string;  // If resuming an existing conversation
}

export function IntakeChat({ outcomeId }: IntakeChatProps) {
  const { sessionId, messages, sendMessage, interrupt } = useIntakeSession(outcomeId);

  return (
    <AgentChat
      sessionId={sessionId}
      messages={messages}
      onSendMessage={sendMessage}
      interrupt={interrupt}
      renderToolResult={customToolRenderers}
      theme={awpChatTheme}
    />
  );
}
```

### 6.2 Custom Tool Renderers

When the intake agent calls tools like `propose_criteria` or `estimate_pricing`, the SDK's tool result rendering is overridden with custom components:

```typescript
const customToolRenderers = {
  propose_criteria: (result: ProposedCriteria) => (
    <CriteriaProposal
      criteria={result.criteria}
      onAccept={(ids) => sendMessage({ type: "criteria_accepted", ids })}
      onModify={(id, changes) => sendMessage({ type: "criteria_modified", id, changes })}
      onReject={(ids) => sendMessage({ type: "criteria_rejected", ids })}
    />
  ),
  estimate_pricing: (result: PricingEstimate) => (
    <PricingEstimate
      estimate={result}
      onAccept={() => sendMessage({ type: "pricing_accepted" })}
      onCounter={(amount) => sendMessage({ type: "pricing_counter", amount })}
    />
  ),
  finalize_outcome: (result: FinalizedOutcome) => (
    <OutcomeSummaryCard outcome={result} />
  ),
};
```

### 6.3 Session Persistence

Conversations persist via the Agents SDK session system. The `session_id` maps to the outcome ID (or a pre-outcome conversation ID for new intakes). When a buyer resumes a conversation:

1. Frontend loads the chat with the `session_id`
2. Agents SDK restores conversation history from its session store (primary source)
3. If the SDK session is unavailable (e.g., expired), fall back to Cosmos DB conversation log
4. The intake agent resumes from its last state — if it was waiting for buyer confirmation, the interrupt banner re-renders

```typescript
// src/hooks/useIntakeSession.ts
export function useIntakeSession(outcomeId?: string) {
  const sessionId = outcomeId ?? generateConversationId();

  // TanStack Query for initial session load
  const { data: sessionData } = useQuery({
    queryKey: ["intake-session", sessionId],
    queryFn: () => outcomeService.getConversation(sessionId),
    staleTime: Infinity,  // Session data doesn't change from polling
  });

  // SSE stream for real-time agent responses
  const { messages, interrupt } = useEventStream({
    endpoint: `/api/intake/${sessionId}/stream`,
    lastEventId: sessionData?.lastEventId,
  });

  const sendMessage = async (content: string | object) => {
    await outcomeService.sendMessage(sessionId, content);
  };

  return { sessionId, messages, sendMessage, interrupt };
}
```

### 6.4 Interrupt States

The Agents SDK supports interrupt states where the agent pauses execution and waits for user input. Layer F renders these as interactive banners or inline prompts:

- **Criteria confirmation**: Agent proposes acceptance criteria, buyer confirms/modifies/rejects
- **Autonomy preference**: Agent asks how much control the buyer wants, rendered as a card with options
- **Budget confirmation**: Agent presents a pricing estimate, buyer accepts or counters
- **Clarification needed**: Agent needs more information, rendered as a follow-up question

When the agent is in an interrupt state, the `InterruptBanner` component renders above the chat input, showing what the agent is waiting for and providing quick-action buttons.

---

## 7. Three-Tier Execution View

The outcome detail page (`/outcomes/:id`) provides three progressively deeper views of execution state. The user switches between tiers via tabs or a depth toggle.

### 7.1 Tier 1 — Roadmap View

A high-level progress overview showing one horizontal bar per execution phase.

**Phases** (derived from execution plan state):

| Phase | Source | Progress Calculation |
|---|---|---|
| Planning | Layer B | Binary: plan approved or not |
| Matching | Layer C | % of tasks with `match_state = ASSIGNED` |
| Execution | Layer D | Weighted % of tasks COMPLETE by estimated duration |
| Verification | Layer D/E | % of acceptance criteria evaluated |

```typescript
// src/components/outcome/RoadmapView.tsx
interface PhaseBar {
  name: string;
  progress: number;       // 0.0–1.0
  status: "pending" | "active" | "complete" | "failed";
  description: string;    // e.g., "3 of 7 tasks matched"
}

export function RoadmapView({ outcomeId }: { outcomeId: string }) {
  const { data: plan } = useExecutionPlan(outcomeId);
  const phases = computePhases(plan);

  return (
    <Stack gap="md">
      {phases.map((phase) => (
        <PhaseBarComponent key={phase.name} phase={phase} />
      ))}
      <CostTracker
        estimated={plan.pricing.estimated_amount_usd}
        spent={plan.cost_tracking.spent_usd}
        showStages={plan.pricing.estimated_amount_usd > COST_STAGE_THRESHOLD}
      />
    </Stack>
  );
}
```

**Cost tracking**: Running cost is shown alongside the roadmap. For outcomes above `COST_STAGE_THRESHOLD` (configurable, default $100), cost is broken down by stage. Below the threshold, only total estimated vs. spent is shown.

```python
# Environment variable
COST_STAGE_THRESHOLD=100.0  # USD — show per-stage cost breakdown above this amount
```

### 7.2 Tier 2 — DAG View

The full task dependency graph rendered with React Flow. Each node is a task showing:

- Task name
- Status badge (color-coded: pending/gray, in_progress/blue, complete/green, failed/red)
- Assigned provider (name or "unmatched")
- Progress indicator (for in-progress tasks)

Edges show dependency relationships. Critical path tasks are visually highlighted (thicker border or glow). The DAG is interactive — clicking a task node opens the Tier 3 detail panel as a side drawer.

```typescript
// src/components/outcome/DagView.tsx
import { ReactFlow, Node, Edge } from "@xyflow/react";

export function DagView({ outcomeId }: { outcomeId: string }) {
  const { data: plan } = useExecutionPlan(outcomeId);
  const { nodes, edges } = useMemo(() => dagLayout(plan), [plan]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={{ task: TaskNodeComponent }}
      onNodeClick={(_, node) => openDetailPanel(node.id)}
      fitView
    />
  );
}
```

### 7.3 Tier 3 — Task Detail Panel

A side-drawer panel showing everything about a single task. Content varies by role:

**Buyer sees:**
- Task description and acceptance criteria
- Assigned provider (name, composite reputation score — no dimension breakdown)
- Status timeline (state transitions with timestamps)
- Activity log: notifications sent, deliverables submitted, evaluation results (pass/fail, not internal LLM scores)
- Comment thread (buyer can add comments)
- Approval actions (if pending)
- "Request specific provider" action

**Worker sees:**
- Task description and acceptance criteria
- Deadline and estimated duration
- Activity log (relevant to their work)
- Deliverable submission form
- Clarification thread with buyer
- Their own reputation score for this skill area

**Buyer does NOT see**: LLM confidence scores, matching candidate lists, internal evaluation rubrics, Layer E scoring details, risk assessments.

```typescript
// src/components/outcome/TaskDetailPanel.tsx
export function TaskDetailPanel({ taskId, role }: { taskId: string; role: "buyer" | "worker" }) {
  const { data: task } = useTask(taskId);
  const { data: events } = useTaskEvents(taskId);
  const { data: comments } = useTaskComments(taskId);

  return (
    <Drawer opened onClose={closePanel} size="lg" position="right">
      <TaskHeader task={task} />
      <TaskStatusTimeline events={events} />
      {role === "buyer" && <BuyerActions task={task} />}
      {role === "worker" && <WorkerActions task={task} />}
      <ActivityLog events={events} role={role} />
      <TaskComments comments={comments} taskId={taskId} />
    </Drawer>
  );
}
```

---

## 8. Approval Gates

Approval gates surface Layer D's governance decisions to the user. When a gate fires, the system creates a notification and renders an approval prompt in the relevant view.

### 8.1 Gate Types

| Gate | Trigger | Who Approves | Timeout |
|---|---|---|---|
| Execution plan approval | Plan created (autonomy 1 & 2) | Buyer | Indefinite |
| Task negotiation approval | Task above cost/risk threshold (Layer C) | Buyer | Indefinite |
| Dispute resolution | Dispute raised | Buyer | Indefinite |
| Amendment acceptance | Contract amendment proposed | Both parties | Indefinite |
| Work verification | Task complete with `human_judgment` criteria | Buyer | Indefinite |

All gates wait indefinitely. Notification is in-app only for v1.

### 8.2 Approval Component

```typescript
// src/components/outcome/ApprovalGate.tsx
interface ApprovalGateProps {
  gate: PendingApproval;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onModify?: (changes: Record<string, unknown>) => void;
}

export function ApprovalGate({ gate, onApprove, onReject, onModify }: ApprovalGateProps) {
  return (
    <Card withBorder shadow="sm" p="lg">
      <Badge color="yellow">Awaiting your approval</Badge>
      <Text mt="sm">{gate.description}</Text>

      {gate.type === "execution_plan" && (
        <PlanApprovalDetail plan={gate.payload} />
      )}
      {gate.type === "dispute_resolution" && (
        <DisputeApprovalDetail
          dispute={gate.payload}
          onCounterPropose={(proposal) => onModify?.({ counter_proposal: proposal })}
        />
      )}
      {gate.type === "work_verification" && (
        <VerificationDetail deliverable={gate.payload} />
      )}

      <Group mt="md">
        <Button color="green" onClick={onApprove}>Approve</Button>
        <Button color="red" variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>
      </Group>
    </Card>
  );
}
```

### 8.3 Dispute Resolution UI

When a dispute is raised, Layer D's AI produces a recommendation (refund, redo, partial_credit, dismissed). The buyer sees:

1. **Dispute summary**: What went wrong, who raised it, evidence
2. **AI recommendation**: The recommended resolution with reasoning (in natural language, not internal scores)
3. **Action options**:
   - Accept AI recommendation
   - Counter-propose: buyer selects a different resolution type and provides free-text justification
   - Request more information: buyer asks for additional evidence or context

```typescript
// src/components/outcome/DisputePanel.tsx
interface DisputeResolution {
  type: "refund" | "redo" | "partial_credit" | "dismissed";
  amount_usd?: number;        // For refund/partial_credit
  reasoning: string;          // Natural language explanation
}

export function DisputePanel({ dispute }: { dispute: Dispute }) {
  const [counterType, setCounterType] = useState<string | null>(null);
  const [counterReason, setCounterReason] = useState("");

  return (
    <Stack>
      <DisputeSummary dispute={dispute} />
      <AIRecommendation recommendation={dispute.ai_recommendation} />

      <Group>
        <Button onClick={() => acceptRecommendation(dispute.id)}>
          Accept Recommendation
        </Button>
        <Button variant="outline" onClick={() => setCounterOpen(true)}>
          Counter-Propose
        </Button>
        <Button variant="subtle" onClick={() => requestMoreInfo(dispute.id)}>
          Need More Info
        </Button>
      </Group>

      {counterOpen && (
        <CounterProposalForm
          resolutionTypes={["refund", "redo", "partial_credit", "dismissed"]}
          onSubmit={(type, reason, amount) =>
            submitCounterProposal(dispute.id, { type, reason, amount })
          }
        />
      )}
    </Stack>
  );
}
```

---

## 9. Buyer Steering

Beyond approval gates, buyers can actively steer execution through three mechanisms.

### 9.1 Task Comments

Buyers can add comments on any task in the DAG. Comments are stored in Cosmos DB and emitted as events on the contract's SSE stream. The Layer D orchestrator agent reads comments and factors them into execution decisions.

```typescript
// POST /api/contracts/{contract_id}/tasks/{task_id}/comments
interface TaskComment {
  id: string;                    // uuid4
  task_id: string;
  contract_id: string;
  author_id: string;             // IdentityRecord.id
  content: string;               // Free-text, supports markdown
  created_at: string;            // ISO 8601
}
```

Comments render as a threaded conversation on the Tier 3 task detail panel. Both buyers and workers can comment on the same task.

### 9.2 Provider Requests

A buyer can request a specific provider for a task that hasn't been assigned yet (task in PENDING, READY, or MATCHING state). This is a soft preference — Layer C's matching pipeline gives the requested provider a significant boost but doesn't guarantee assignment if the provider is unavailable or unqualified.

```typescript
// POST /api/contracts/{contract_id}/tasks/{task_id}/provider-request
interface ProviderRequest {
  task_id: string;
  requested_provider_id: string;
  reason?: string;               // Optional justification
}
```

The UI surfaces this as a "Request Provider" button on the task detail panel. If the buyer has worked with a provider before (visible from their outcome history), an autocomplete suggests known providers.

### 9.3 Free-Text Feedback

After a task completes (or at any point during execution), buyers can submit free-text feedback. This feeds into Layer E's reputation scoring via the `update_weight_agent` which determines how much weight to assign the feedback.

```typescript
// POST /api/contracts/{contract_id}/tasks/{task_id}/feedback
interface TaskFeedback {
  task_id: string;
  contract_id: string;
  author_id: string;
  content: string;               // Free-text feedback
  sentiment: "positive" | "neutral" | "negative" | null;  // Optional, UI can infer
}
```

---

## 10. Worker Experience

### 10.1 Worker Dashboard

The worker's dashboard section ("My Tasks") shows:

- **Active tasks**: Tasks currently assigned to this worker, grouped by status (assigned, in_progress, evaluating)
- **Pending acceptance**: Tasks where the worker has been matched but hasn't accepted yet
- **Completed tasks**: Recent completed tasks with evaluation results
- **Reputation summary**: Composite score + trend indicator (up/down/stable)

```typescript
// src/components/dashboard/TaskList.tsx
export function TaskList({ identityId }: { identityId: string }) {
  const { data: tasks } = useWorkerTasks(identityId);

  const grouped = groupBy(tasks, (t) =>
    t.match_state === "MATCHED" ? "pending_acceptance" :
    t.status === "IN_PROGRESS" ? "active" :
    t.status === "COMPLETE" ? "completed" : "other"
  );

  return (
    <Stack>
      {grouped.pending_acceptance?.length > 0 && (
        <Section title="Awaiting Your Response">
          {grouped.pending_acceptance.map((t) => (
            <TaskAcceptCard key={t.id} task={t} />
          ))}
        </Section>
      )}
      <Section title="Active Tasks">
        {grouped.active?.map((t) => <TaskActiveCard key={t.id} task={t} />)}
      </Section>
      <Section title="Recently Completed">
        {grouped.completed?.map((t) => <TaskCompletedCard key={t.id} task={t} />)}
      </Section>
    </Stack>
  );
}
```

### 10.2 Task Acceptance

When Layer C assigns a worker to a task, the worker receives an in-app notification. The task appears in "Pending Acceptance" with:

- Task description and acceptance criteria
- Estimated duration and deadline
- Offered compensation (from task cost estimate)
- Accept / Decline buttons

Declining triggers Layer C to reroute the task to the next candidate.

```typescript
// POST /api/tasks/{task_id}/accept
// POST /api/tasks/{task_id}/decline
interface TaskDeclinePayload {
  reason?: string;  // Optional — feeds into Layer E data
}
```

### 10.3 Deliverable Submission

When a worker completes a task, they submit through a form with:

1. **Free-text summary**: What was done, any notes (rendered with BlockNote for rich text)
2. **Structured fields** (minimal, task-type-dependent): File upload for deliverables, link to external artifact, checklist of acceptance criteria self-assessment
3. **Submit button**: Transitions task to EVALUATING state

After submission, the buyer may request clarification. This opens a clarification thread — a simple back-and-forth between buyer and worker, rendered inline on the task detail panel.

```typescript
// POST /api/tasks/{task_id}/submit
interface DeliverableSubmission {
  task_id: string;
  summary: string;                       // Free-text, markdown supported
  artifacts: DeliverableArtifact[];      // File references (Azure Blob Storage URLs)
  criteria_self_assessment: Record<string, boolean>;  // Criterion ID → self-assessed pass/fail
}

interface DeliverableArtifact {
  type: "file" | "link" | "text";
  url?: string;                          // For file (Blob Storage) or link
  content?: string;                      // For inline text
  description: string;
}
```

### 10.4 Clarification Thread

After a worker submits, the buyer can ask for clarification before approving. This is a simple message thread on the task, distinct from task comments (which are general) — clarification is specifically about the submitted deliverable.

```typescript
// POST /api/tasks/{task_id}/clarification
interface ClarificationMessage {
  task_id: string;
  author_id: string;
  content: string;           // Free-text
  in_response_to?: string;   // Previous message ID
}
```

The buyer sees a "Request Clarification" button on the verification approval gate. The worker sees the clarification request in their task view with a reply form.

---

## 11. Profile Claiming (Worker Onboarding)

When Layer C discovers a worker via web crawl and AWP invites them (via disclosed outreach when matched to a buyer's query), the invitation includes a unique claim link.

### 11.1 Claim Flow

```
/claim/:invite_code → ClaimProfile component
```

1. **Welcome screen**: Explains what AWP is and why the worker was invited
2. **Profile preview**: Shows what AWP already knows about the worker (discovered skills, source URLs, confidence level). The worker sees: "We found your profile at [source]. Here's what we know:"
3. **Confirm or correct**: Worker confirms discovered capabilities or corrects them
4. **Create account**: Azure AD B2C sign-up flow
5. **Link identity**: The new `IdentityRecord` is linked to the existing crawl-discovered `CapabilityCard`
6. **Onboarding complete**: Worker lands on their dashboard with their first available task (if matched)

```typescript
// src/components/profile/ClaimProfile.tsx
export function ClaimProfile() {
  const { invite_code } = useParams();
  const { data: profile } = useQuery({
    queryKey: ["claim", invite_code],
    queryFn: () => identityService.getClaimProfile(invite_code),
  });

  const [step, setStep] = useState<"welcome" | "preview" | "confirm" | "signup" | "done">("welcome");

  return (
    <Stepper active={stepIndex(step)}>
      <Stepper.Step label="Welcome"><WelcomeScreen /></Stepper.Step>
      <Stepper.Step label="Your Profile">
        <ProfilePreview
          discoveredSkills={profile.capabilities}
          sources={profile.discovery_sources}
          confidenceLevel={profile.trust_level}
        />
      </Stepper.Step>
      <Stepper.Step label="Confirm">
        <CapabilityEditor
          capabilities={profile.capabilities}
          onConfirm={(confirmed) => {
            identityService.confirmCapabilities(invite_code, confirmed);
            setStep("signup");
          }}
        />
      </Stepper.Step>
      <Stepper.Step label="Create Account">
        <AzureB2CSignup onComplete={(account) => {
          identityService.linkClaim(invite_code, account.localAccountId);
          setStep("done");
        }} />
      </Stepper.Step>
      <Stepper.Step label="Done"><OnboardingComplete /></Stepper.Step>
    </Stepper>
  );
}
```

### 11.2 Trust Level Upgrade

On claiming, the worker's trust level upgrades from `unverified` to `email_verified` (Azure AD B2C confirms their email). Further verification (identity, credentials) happens through Layer C's verification pipeline.

---

## 12. Real-Time Event Stream

### 12.1 SSE Connection

Layer F connects to Layer D's SSE endpoint for each active contract. The connection uses the ReadableStream API (not EventSource) for better control over parsing and reconnection.

```typescript
// src/services/eventStreamService.ts
export class EventStreamConnection {
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private lastEventId: string | null = null;
  private abortController: AbortController | null = null;

  constructor(
    private contractId: string,
    private onEvent: (event: ContractEvent) => void,
  ) {}

  async connect() {
    this.abortController = new AbortController();
    const url = new URL(`/api/contracts/${this.contractId}/events`);
    if (this.lastEventId) {
      url.searchParams.set("last_event_id", this.lastEventId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "text/event-stream",
        "Authorization": `Bearer ${getAccessToken()}`,
      },
      signal: this.abortController.signal,
    });

    this.reader = response.body!.getReader();
    this.consume();
  }

  private async consume() {
    const decoder = new TextDecoder();
    let buffer = "";

    while (this.reader) {
      const { done, value } = await this.reader.read();
      if (done) { this.reconnect(); return; }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const event = JSON.parse(line.slice(6)) as ContractEvent;
          this.lastEventId = event.event_id;
          this.onEvent(event);
        }
      }
    }
  }

  private async reconnect() {
    await delay(1000 + Math.random() * 2000);  // Jitter
    this.connect();
  }

  disconnect() {
    this.abortController?.abort();
    this.reader = null;
  }
}
```

### 12.2 SSE Hook

```typescript
// src/hooks/useEventStream.ts
export function useEventStream(contractId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const conn = new EventStreamConnection(contractId, (event) => {
      // Invalidate relevant TanStack Query caches based on event type
      switch (event.event_type) {
        case "task.state_changed":
          queryClient.invalidateQueries({ queryKey: ["execution-plan", contractId] });
          queryClient.invalidateQueries({ queryKey: ["task", event.task_id] });
          break;
        case "contract.state_changed":
          queryClient.invalidateQueries({ queryKey: ["outcome", contractId] });
          break;
        case "task.evaluation_complete":
          queryClient.invalidateQueries({ queryKey: ["task", event.task_id] });
          break;
        case "autonomy_gate.blocked":
          queryClient.invalidateQueries({ queryKey: ["approvals", contractId] });
          addNotification(event);
          break;
      }
    });

    conn.connect();
    return () => conn.disconnect();
  }, [contractId]);
}
```

### 12.3 Reconnection & State Reconciliation

On reconnection, the frontend sends `last_event_id` as a query parameter. Layer D replays all events after that ID from Cosmos DB. This guarantees no events are missed. If `last_event_id` is null (first connection or state lost), the frontend fetches full current state via REST and starts SSE from the latest event.

---

## 13. Generative UI

### 13.1 Concept

Certain UI elements are server-driven — the backend (or an LLM agent) determines what components to render and with what data. This enables:

- Task-type-specific detail panels (a code review task shows a diff viewer; a content task shows a text preview)
- Dynamic approval gate content (the AI recommendation for a dispute includes context-specific visualizations)
- Adaptive onboarding steps based on what the crawler discovered about a worker

### 13.2 Server-Driven UI Protocol

The backend returns a UI definition as a JSON structure. The frontend has a component registry that maps definition types to React components.

```typescript
// Server response for a task detail section
interface GenerativeUIBlock {
  component: string;              // Registry key (e.g., "code_diff", "image_gallery", "checklist")
  props: Record<string, unknown>; // Props passed to the component
  layout?: {
    order: number;                // Display order
    width: "full" | "half";      // Layout hint
  };
}

// Example: server returns this for a code review task
[
  {
    "component": "code_diff",
    "props": { "diff_url": "/api/artifacts/abc123/diff", "language": "python" },
    "layout": { "order": 1, "width": "full" }
  },
  {
    "component": "checklist",
    "props": {
      "items": [
        { "label": "Tests pass", "checked": true },
        { "label": "No security issues", "checked": false }
      ]
    },
    "layout": { "order": 2, "width": "half" }
  }
]
```

### 13.3 Component Registry

```typescript
// src/components/generative/GenerativeRenderer.tsx
import { CodeDiff } from "./components/CodeDiff";
import { ImageGallery } from "./components/ImageGallery";
import { Checklist } from "./components/Checklist";
import { TextPreview } from "./components/TextPreview";
import { MapView } from "./components/MapView";
import { FileList } from "./components/FileList";

const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  code_diff: CodeDiff,
  image_gallery: ImageGallery,
  checklist: Checklist,
  text_preview: TextPreview,
  map_view: MapView,
  file_list: FileList,
};

export function GenerativeRenderer({ blocks }: { blocks: GenerativeUIBlock[] }) {
  const sorted = [...blocks].sort((a, b) => (a.layout?.order ?? 0) - (b.layout?.order ?? 0));

  return (
    <Grid>
      {sorted.map((block, i) => {
        const Component = COMPONENT_REGISTRY[block.component];
        if (!Component) return <UnknownBlock key={i} type={block.component} />;
        return (
          <Grid.Col key={i} span={block.layout?.width === "half" ? 6 : 12}>
            <Component {...block.props} />
          </Grid.Col>
        );
      })}
    </Grid>
  );
}
```

### 13.4 When Generative UI Is Used

- **Task detail panel (Tier 3)**: The `generative_ui_blocks` field on the task API response provides additional context-specific sections beyond the standard fields
- **Deliverable preview**: When a worker submits a deliverable, the system generates appropriate preview components based on artifact types
- **Intake conversation**: Custom tool renderers (Section 6.2) are a form of generative UI scoped to the chat context

The generative UI system is additive — standard components always render. Generative blocks add task-type-specific enhancements.

---

## 14. Notifications

### 14.1 In-App Notifications

All notifications are in-app for v1. A notification bell in the app header shows unread count. Clicking opens a notification panel with a scrollable list.

```typescript
// src/stores/notificationStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Notification {
  id: string;
  type: string;                  // e.g., "approval_required", "task_completed", "dispute_raised"
  title: string;
  body: string;
  contract_id: string;
  task_id?: string;
  importance: "critical" | "high" | "medium" | "low" | "debug";  // Matches Layer D's EventImportance enum
  read: boolean;
  created_at: string;
  action_url?: string;           // Deep link to relevant view
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (n) =>
        set((state) => ({
          notifications: [n, ...state.notifications].slice(0, 200),  // Keep last 200
          unreadCount: state.unreadCount + 1,
        })),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
    }),
    { name: "awp-notifications" }
  )
);
```

### 14.2 Notification Sources

Notifications are derived from SSE events. The mapping:

| Event Type | Layer D Importance | Notification |
|---|---|---|
| `autonomy_gate.blocked` | HIGH | "Action needed: [description]" |
| `task.failed` | CRITICAL | "Task failed: [task name]" |
| `dispute.raised` | CRITICAL | "Dispute raised on [outcome]" |
| `task.completed` | HIGH | "Task completed: [task name]" |
| `task.state_changed` → ASSIGNED (worker) | MEDIUM | "New task assigned to you" |
| `task.evaluation_complete` | HIGH | "Evaluation complete: [result]" |
| `task.started` | MEDIUM | "Task started: [task name]" |
| `contract.state_changed` → COMPLETE | HIGH | "Outcome complete!" |
| `sla.warning` | CRITICAL | "SLA warning: [type] approaching limit" |
| `task.comment_added` | (Layer F event) | "New comment on [task name]" |

### 14.3 Persistence

Notification state is persisted to Zustand's `persist` middleware (localStorage) for quick hydration on page load. The authoritative notification history is in Cosmos DB — the localStorage cache is a convenience for unread state.

```typescript
// On app load, sync notifications from Cosmos DB
const { data: serverNotifications } = useQuery({
  queryKey: ["notifications"],
  queryFn: () => notificationService.getRecent(200),
  staleTime: 60_000,
});
```

---

## 15. Payment Placeholders

### 15.1 Feature Flag

```python
# Environment variable
PAYMENTS_ENABLED=false   # Toggle payment UI on/off
```

```typescript
// Frontend
const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === "true";
```

### 15.2 When Flag Is Off (Default)

The payment section is completely hidden from the UI. No "coming soon" messaging — payment simply doesn't appear. Cost tracking (Section 7.1) still shows estimated and running costs as informational data, since this is derived from Layer B/D cost estimates, not actual payment processing.

### 15.3 When Flag Is On

The payment section renders in:

- **Outcome detail**: Payment status, amount, escrow state
- **Settings**: Payment method configuration

The payment backend integrates with:

- **Skyfire**: For agentic payments (AI agent → AI agent, AI agent → human)
- **Stripe**: For human-to-human payments and buyer-to-AWP payments

```typescript
// src/components/payment/PaymentPlaceholder.tsx
// This component is the integration point — all payment UI goes through here
export function PaymentSection({ contractId }: { contractId: string }) {
  if (!PAYMENTS_ENABLED) return null;

  const { data: payment } = usePaymentStatus(contractId);

  return (
    <Card>
      <Text fw={500}>Payment</Text>
      <PaymentStatusBadge status={payment.status} />
      <Text>Amount: {formatCurrency(payment.amount_usd)}</Text>
      {payment.escrow && <EscrowIndicator escrowState={payment.escrow_state} />}
    </Card>
  );
}
```

### 15.4 Payment Service Interface

The payment service defines the interface but v1 implementations are stubs:

```typescript
// src/services/paymentService.ts
interface PaymentService {
  getStatus(contractId: string): Promise<PaymentStatus>;
  initiatePayment(contractId: string, method: PaymentMethod): Promise<PaymentResult>;
  getEscrowState(contractId: string): Promise<EscrowState>;
}

// v1: stub implementation
class StubPaymentService implements PaymentService {
  async getStatus(): Promise<PaymentStatus> {
    return { status: "pending", amount_usd: 0, escrow: false };
  }
  // ...
}
```

---

## 16. Cosmos DB Storage (Layer F)

### 16.1 What Layer F Stores

Layer F persists its own data in Cosmos DB, partitioned by `identity_id`:

| Collection | Contents | Partition Key |
|---|---|---|
| `ui_preferences` | Theme, notification settings, default view tier, collapsed panels | `identity_id` |
| `notifications` | Full notification history with read state | `identity_id` |
| `task_comments` | Comment threads on tasks | `contract_id` |
| `task_feedback` | Buyer free-text feedback on tasks | `contract_id` |
| `provider_requests` | Buyer provider preference requests | `contract_id` |
| `clarification_threads` | Buyer-worker clarification messages | `task_id` |
| `deliverable_submissions` | Worker deliverable submissions | `task_id` |
| `claim_invitations` | Profile claim invitation codes and status | `invite_code` |

### 16.2 Data Flow

Layer F reads from Layers A–E via their REST APIs and SSE streams. Layer F writes to its own Cosmos DB collections for UI-specific data. When Layer F data needs to reach other layers (e.g., task feedback → Layer E, provider requests → Layer C), it emits events to the Kafka event bus:

```
task.comment_added      → consumed by Layer D (orchestrator factors into decisions)
task.feedback_submitted → consumed by Layer E (reputation scoring)
provider.requested      → consumed by Layer C (matching pipeline boost)
task.deliverable_submitted → consumed by Layer D (triggers evaluation)
task.accepted           → consumed by Layer D (starts execution)
task.declined           → consumed by Layer C (reroute to next candidate)
clarification.sent      → consumed by Layer D (pause evaluation until resolved)
```

---

## 17. API Surface

Layer F does not have its own backend API server. It talks directly to the existing layer APIs. However, it needs a thin API gateway for:

1. **Authentication**: Validating Azure AD B2C tokens and mapping to `IdentityRecord` IDs
2. **Comment/feedback storage**: CRUD for Layer F's own Cosmos DB collections
3. **Notification sync**: Fetching notification history from Cosmos DB
4. **Profile claiming**: The claim flow endpoints
5. **File upload**: Proxying artifact uploads to Azure Blob Storage

### 17.1 Layer F API (FastAPI)

A lightweight FastAPI service handles Layer F's own data:

```python
# packages/buyer_surface/api.py
from fastapi import FastAPI, Depends
from shared.azure_client import make_model

app = FastAPI(title="AWP Control Surface API", version="1.0")

# === Comments ===
@app.post("/api/contracts/{contract_id}/tasks/{task_id}/comments")
async def add_comment(contract_id: str, task_id: str, body: CommentCreate, user: Identity = Depends(get_current_user)):
    ...

# === Feedback ===
@app.post("/api/contracts/{contract_id}/tasks/{task_id}/feedback")
async def submit_feedback(contract_id: str, task_id: str, body: FeedbackCreate, user: Identity = Depends(get_current_user)):
    ...

# === Provider Requests ===
@app.post("/api/contracts/{contract_id}/tasks/{task_id}/provider-request")
async def request_provider(contract_id: str, task_id: str, body: ProviderRequest, user: Identity = Depends(get_current_user)):
    ...

# === Deliverables ===
@app.post("/api/tasks/{task_id}/submit")
async def submit_deliverable(task_id: str, body: DeliverableSubmission, user: Identity = Depends(get_current_user)):
    ...

@app.post("/api/tasks/{task_id}/accept")
async def accept_task(task_id: str, user: Identity = Depends(get_current_user)):
    ...

@app.post("/api/tasks/{task_id}/decline")
async def decline_task(task_id: str, body: TaskDeclinePayload, user: Identity = Depends(get_current_user)):
    ...

# === Clarification ===
@app.post("/api/tasks/{task_id}/clarification")
async def send_clarification(task_id: str, body: ClarificationMessage, user: Identity = Depends(get_current_user)):
    ...

# === Notifications ===
@app.get("/api/notifications")
async def get_notifications(user: Identity = Depends(get_current_user), limit: int = 200):
    ...

@app.post("/api/notifications/{notification_id}/read")
async def mark_read(notification_id: str, user: Identity = Depends(get_current_user)):
    ...

# === Profile Claiming ===
@app.get("/api/claim/{invite_code}")
async def get_claim_profile(invite_code: str):
    ...

@app.post("/api/claim/{invite_code}/confirm")
async def confirm_claim(invite_code: str, body: ClaimConfirmation, user: Identity = Depends(get_current_user)):
    ...

# === File Upload ===
@app.post("/api/upload")
async def upload_artifact(file: UploadFile, user: Identity = Depends(get_current_user)):
    # Upload to Azure Blob Storage, return URL
    ...

# === Approvals ===
@app.get("/api/contracts/{contract_id}/approvals")
async def get_pending_approvals(contract_id: str, user: Identity = Depends(get_current_user)):
    ...

@app.post("/api/approvals/{approval_id}/approve")
async def approve(approval_id: str, user: Identity = Depends(get_current_user)):
    ...

@app.post("/api/approvals/{approval_id}/reject")
async def reject(approval_id: str, body: RejectPayload, user: Identity = Depends(get_current_user)):
    ...

@app.post("/api/approvals/{approval_id}/counter-propose")
async def counter_propose(approval_id: str, body: CounterProposal, user: Identity = Depends(get_current_user)):
    ...
```

### 17.2 Authentication Middleware

```python
# packages/buyer_surface/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def get_current_user(token = Depends(security)) -> Identity:
    """Validate Azure AD B2C token and resolve to IdentityRecord."""
    try:
        payload = jwt.decode(
            token.credentials,
            key=get_b2c_signing_keys(),
            algorithms=["RS256"],
            audience=AZURE_AD_B2C_CLIENT_ID,
            issuer=AZURE_AD_B2C_ISSUER,
        )
        identity = await identity_service.get_by_external_id(
            provider="azure_ad_b2c",
            external_id=payload["oid"],
        )
        if not identity:
            raise HTTPException(status_code=401, detail="Identity not found")
        return identity
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## 18. Test Workers

For development and testing, the system supports adding test workers without the web crawl pipeline.

### 18.1 Test Worker Seeding

```typescript
// Available when VITE_TEST_MODE=true
// UI: Settings → Developer → Add Test Worker

interface TestWorker {
  name: string;
  email: string;
  capabilities: string[];        // Free-form skill tags
  hourly_rate_usd: number;
  availability: "available" | "busy";
  response_pattern: "instant" | "delayed" | "unreliable";  // Simulates real-world behavior
}
```

Test workers are created via a dev-only API endpoint that:
1. Creates an `IdentityRecord` with `trust_level = platform_verified`
2. Creates a `CapabilityCard` with the specified skills
3. Optionally simulates task acceptance/completion patterns based on `response_pattern`

```python
# packages/buyer_surface/api.py — dev-only endpoint
@app.post("/api/dev/test-workers", include_in_schema=False)
async def create_test_worker(body: TestWorkerCreate):
    if not settings.TEST_MODE:
        raise HTTPException(status_code=404)
    ...
```

### 18.2 MSW Mocks

For frontend development without a backend, MSW handlers simulate all layer APIs:

```typescript
// src/mocks/handlers/layerD.ts
import { http, HttpResponse } from "msw";

export const layerDHandlers = [
  http.get("/api/contracts/:contractId/events", ({ params }) => {
    // Return a ReadableStream that simulates SSE events
    const stream = new ReadableStream({
      start(controller) {
        const events = generateMockEvents(params.contractId);
        let i = 0;
        const interval = setInterval(() => {
          if (i >= events.length) { clearInterval(interval); controller.close(); return; }
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(events[i])}\n\n`));
          i++;
        }, 1000);
      },
    });
    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }),
  // ... other handlers
];
```

---

## 19. Environment Configuration

```bash
# === Azure AD B2C ===
VITE_AZURE_AD_B2C_TENANT=awp
VITE_AZURE_AD_B2C_CLIENT_ID={client-id}
VITE_AZURE_AD_B2C_AUTHORITY=https://awp.b2clogin.com/awp.onmicrosoft.com/B2C_1_signupsignin
VITE_AZURE_AD_B2C_REDIRECT_URI=https://app.awp.com

# === API Endpoints (direct to layer APIs) ===
VITE_API_LAYER_A=http://localhost:8001     # Outcome Schema API
VITE_API_LAYER_B=http://localhost:8002     # Decomposition API
VITE_API_LAYER_C=http://localhost:8003     # Routing Index API
VITE_API_LAYER_D=http://localhost:8004     # Execution API (including SSE)
VITE_API_LAYER_E=http://localhost:8005     # Reputation API
VITE_API_LAYER_F=http://localhost:8006     # Layer F's own API (comments, feedback, notifications)

# === Feature Flags ===
VITE_PAYMENTS_ENABLED=false                # Toggle payment UI
VITE_TEST_MODE=false                       # Enable dev tools (test workers, mock controls)
VITE_USE_MOCKS=false                       # Enable MSW for full offline development

# === Layer F Backend ===
COSMOS_DB_ENDPOINT=https://{account}.documents.azure.com
COSMOS_DB_KEY={key}
COSMOS_DB_DATABASE=awp_layer_f
AZURE_BLOB_STORAGE_CONNECTION_STRING={connection-string}
AZURE_BLOB_STORAGE_CONTAINER=deliverables
KAFKA_BOOTSTRAP_SERVERS={servers}
KAFKA_TOPIC_PREFIX=pln.layer_f

# === Payment (when PAYMENTS_ENABLED=true) ===
SKYFIRE_API_KEY={key}                      # Agentic payments
STRIPE_SECRET_KEY={key}                    # Human payments
STRIPE_PUBLISHABLE_KEY={key}

# === Thresholds ===
COST_STAGE_THRESHOLD=100.0                 # USD — show per-stage cost breakdown above this
```

---

## 20. Events Emitted

Layer F emits events to the Kafka event bus when user actions need to reach other layers.

### 20.1 Event Definitions

```python
class TaskCommentAddedEvent(BaseModel):
    event_type: Literal["task.comment_added"] = "task.comment_added"
    contract_id: str
    task_id: str
    comment_id: str
    author_id: str
    content: str
    timestamp: datetime

class TaskFeedbackSubmittedEvent(BaseModel):
    event_type: Literal["task.feedback_submitted"] = "task.feedback_submitted"
    contract_id: str
    task_id: str
    author_id: str
    content: str
    sentiment: str | None
    timestamp: datetime

class ProviderRequestedEvent(BaseModel):
    event_type: Literal["provider.requested"] = "provider.requested"
    contract_id: str
    task_id: str
    requested_provider_id: str
    requester_id: str
    reason: str | None
    timestamp: datetime

class DeliverableSubmittedEvent(BaseModel):
    event_type: Literal["task.deliverable_submitted"] = "task.deliverable_submitted"
    task_id: str
    contract_id: str
    worker_id: str
    summary: str
    artifact_urls: list[str]
    timestamp: datetime

class TaskAcceptedEvent(BaseModel):
    event_type: Literal["task.accepted"] = "task.accepted"
    task_id: str
    contract_id: str
    worker_id: str
    timestamp: datetime

class TaskDeclinedEvent(BaseModel):
    event_type: Literal["task.declined"] = "task.declined"
    task_id: str
    contract_id: str
    worker_id: str
    reason: str | None
    timestamp: datetime

class ApprovalDecisionEvent(BaseModel):
    event_type: Literal["approval.decision"] = "approval.decision"
    approval_id: str
    contract_id: str
    task_id: str | None
    decision: Literal["approved", "rejected", "counter_proposed"]
    counter_proposal: dict | None       # Present when decision is counter_proposed
    decided_by: str
    timestamp: datetime

class ClarificationSentEvent(BaseModel):
    event_type: Literal["clarification.sent"] = "clarification.sent"
    task_id: str
    contract_id: str
    author_id: str
    content: str
    timestamp: datetime

class ProfileClaimedEvent(BaseModel):
    event_type: Literal["profile.claimed"] = "profile.claimed"
    identity_id: str
    capability_card_id: str
    invite_code: str
    confirmed_capabilities: list[str]
    timestamp: datetime
```

### 20.2 Event Topics

```
pln.layer_f.comments          → Layer D
pln.layer_f.feedback          → Layer E
pln.layer_f.provider_requests → Layer C
pln.layer_f.deliverables      → Layer D
pln.layer_f.task_responses    → Layer C (decline) / Layer D (accept)
pln.layer_f.approvals         → Layer D
pln.layer_f.clarifications    → Layer D
pln.layer_f.claims            → Layer C
```

---

## 21. Events Consumed

Layer F consumes events via SSE from Layer D (which aggregates events from all layers for a given contract). Additionally, Layer F's backend listens to Kafka topics for events that generate notifications.

### 21.1 Kafka Consumers (Layer F Backend)

```
pln.tasks                     → Generate notifications for task state changes
pln.execution                 → Generate notifications for execution events (autonomy gates, evaluations)
pln.disputes                  → Generate dispute notifications
pln.matching                  → Generate "new task assigned" notifications for workers
pln.reputation                → Update cached reputation scores
```

---

## 22. Testing Strategy

### 22.1 Unit Tests (Vitest)

- **Component rendering**: Each component renders correctly with mock data
- **Hook behavior**: TanStack Query hooks return expected data shapes, Zustand stores update correctly
- **Event parsing**: SSE event parser handles malformed data, reconnection logic
- **Notification mapping**: SSE events correctly map to notification types and importance levels
- **Approval gate logic**: Correct gate types render for each approval scenario
- **Auth flow**: Token validation, identity mapping, expired token handling

### 22.2 Integration Tests (Vitest + MSW)

- **Full intake flow**: User sends message → agent responds → criteria proposed → user accepts → outcome created
- **Approval flow**: Gate fires → notification appears → user approves → state updates
- **Worker acceptance flow**: Task assigned → worker accepts → task moves to IN_PROGRESS
- **Deliverable submission**: Worker submits → buyer sees deliverable → requests clarification → worker responds → buyer approves
- **SSE reconnection**: Connection drops → reconnects with last_event_id → missed events replayed
- **Profile claiming**: Invite code → preview → confirm → sign up → identity linked

### 22.3 E2E Tests (Playwright)

- **Buyer journey**: Sign up → create outcome → approve plan → monitor execution → verify completion
- **Worker journey**: Claim profile → accept task → submit deliverable → view reputation
- **Dual-role journey**: User creates outcome as buyer, accepts task on different contract as worker
- **Dispute flow**: Task fails → dispute raised → buyer sees AI recommendation → counter-proposes → resolved
- **Real-time updates**: Two browser contexts (buyer + worker), verify SSE events propagate correctly
- **Mobile viewport**: All critical flows work on 375px width

### 22.4 Test Fixtures

```typescript
// src/test/fixtures/outcomes.ts
export const mockOutcome = {
  id: "outcome-001",
  type: "deliverable",
  domain: "home_services",
  description: "Clean all gutters on a two-story house",
  contract_id: "contract-001",
  state: "active",
  // ...
};

export const mockExecutionPlan = {
  id: "plan-001",
  contract_id: "contract-001",
  status: "executing",
  tasks: [
    { id: "task-001", name: "Inspect gutters", status: "complete", match_state: "assigned", progress: 1.0 },
    { id: "task-002", name: "Clear debris", status: "in_progress", match_state: "assigned", progress: 0.6 },
    { id: "task-003", name: "Test downspouts", status: "pending", match_state: "matching", progress: 0.0 },
  ],
  // ...
};

// src/test/fixtures/workers.ts
export const testWorkers: TestWorker[] = [
  {
    name: "Harold (Test)",
    email: "harold.test@awp.dev",
    capabilities: ["gutter_cleaning", "roof_inspection", "general_maintenance"],
    hourly_rate_usd: 45,
    availability: "available",
    response_pattern: "instant",
  },
  // ...
];
```

---

## 23. Cross-Layer API Calls

Layer F calls other layers directly via REST. Here is the complete map of which layer APIs the frontend consumes:

| Layer | Endpoint Pattern | Purpose |
|---|---|---|
| A | `GET /api/outcomes/:id` | Fetch outcome details |
| A | `POST /api/intake/:sessionId/message` | Send message in intake conversation |
| A | `GET /api/intake/:sessionId/stream` | SSE stream for intake conversation |
| B | `GET /api/contracts/:id/plan` | Fetch execution plan (DAG) |
| C | `GET /api/identity/:id` | Fetch identity record |
| C | `POST /api/identity` | Create identity (on first sign-in) |
| C | `GET /api/workers/:id/capability-card` | Fetch worker capability card |
| C | `GET /api/claim/:inviteCode/profile` | Fetch discovered profile for claiming |
| D | `GET /api/contracts/:id/events` | SSE stream for contract execution |
| D | `GET /api/contracts/:id/tasks/:id` | Fetch task details |
| D | `GET /api/contracts/:id/tasks/:id/events` | Fetch task event history |
| E | `GET /api/reputation/:identityId` | Fetch reputation scores |
| E | `GET /api/reputation/:identityId/summary` | Simplified reputation for display |
| F | All `/api/` endpoints from Section 17.1 | Layer F's own data |

---

## 24. Open Questions (Resolve During Implementation)

1. **`@openai/agents-ui` customization depth**: Evaluate how much the SDK's chat components can be styled vs. whether we need to fork/wrap them. If customization is limited, we may build our own chat renderer that uses the SDK's streaming primitives.

2. **React Flow performance at scale**: A DAG with 50 tasks should render smoothly. Evaluate React Flow's performance with 50+ nodes and consider virtualization or simplified rendering for large DAGs.

3. **Cosmos DB cross-partition queries**: Notifications are partitioned by `identity_id`, but the backend may need to query "all unread notifications for contracts this user is involved in." Evaluate whether this requires a secondary index or a denormalized view.

4. **SSE connection limits**: Browsers limit concurrent SSE connections (typically 6 per domain). A buyer with multiple active outcomes may hit this limit. Consider multiplexing multiple contract streams over a single SSE connection, or using a single "user events" stream.

5. **Generative UI security**: Server-driven UI renders components based on backend responses. Ensure the component registry is a whitelist — never render arbitrary component names from the server. Validate all props before passing to components.

6. **Azure AD B2C pricing**: B2C charges per authentication. Model expected auth volume and confirm B2C is cost-effective vs. alternatives (Auth0, Clerk, self-hosted).

7. **File upload size limits**: Deliverable artifacts uploaded to Azure Blob Storage need size limits. Define per-file and per-submission limits. Consider resumable uploads for large files.
