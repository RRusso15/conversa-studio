# Builder Persistence Implementation Plan

## Purpose

This document is the working implementation reference for moving Conversa Studio from auth-only plus mock builder data to a real persisted bot builder flow.

We will use this file as the source of truth while implementing the work in smaller, stable slices to avoid losing progress if the IDE extension or session terminates.

## Goal

Implement the builder as the next real product surface after auth, with these two architecture rules enforced throughout:

1. Frontend state and API orchestration for bots and the builder must follow the 4-file provider pattern:
   - `actions.tsx`
   - `context.tsx`
   - `reducer.tsx`
   - `index.tsx`
2. Backend bot persistence must follow the canonical structure in `backend/aspnet-core/BACKEND_STRUCTURE.md`:
   - domain logic in `Core/Domains/Bots/`
   - app services and DTOs in `Application/Services/Bots/`
   - persistence in `EntityFrameworkCore`
   - no bot business logic in `Web.Core` or `Web.Host`

For this phase, `project = bot` remains the MVP model.

## End-State User Flow

### Projects page

- `/developer/projects` shows the authenticated user’s bots from the backend.
- Each card represents one bot record.
- Clicking a card opens `/developer/builder/[id]`.
- Clicking `New Bot` opens `/developer/builder/new`.

### New bot flow

- `/developer/builder/new` starts with a temporary local starter graph.
- No backend bot is created immediately.
- The first successful autosave creates the bot in the backend.
- After create succeeds, the frontend replaces the route with `/developer/builder/{id}`.

### Existing bot flow

- `/developer/builder/[id]` fetches the persisted draft bot from the backend.
- The builder hydrates from the returned graph.
- Editing changes local builder state immediately.
- Autosave persists the updated draft.

### Save and validation behavior

- Autosave is the primary save mechanism.
- Manual `Save` remains visible in the toolbar.
- Save states shown in the UI:
  - `Saving`
  - `Saved`
  - `Save failed`
- Validation can be triggered manually and should also guard persistence.
- Backend validation remains the source of truth.

## Architecture Decisions

### Product model

- `Project = Bot` for the MVP.
- The existing Projects page stays in place, but the cards now represent persisted bot records.
- Full project containers, multi-bot projects, and full revision history are deferred.

### Versioning model

- Support one editable draft per bot.
- Reserve a `Published` concept in the data model for later work.
- Do not implement full publish flow or revision history in this phase.

### Save model

- Use autosave plus manual save.
- First autosave on a temporary new bot creates the persisted bot.
- Later autosaves update the same bot.

## Current Repo State Before Completion

### Frontend today

- The projects list is currently hardcoded.
- The builder currently uses mock graph data.
- Save currently only updates local state.
- The builder context started as one large file and needs to live behind a provider-pattern structure.

### Backend today

- Auth exists and is working.
- No real `Bots` capability existed originally.
- No persisted bot definitions were available before this work.
- Backend architecture expects bot definitions, graph validation, versioning, and runtime contracts to be backend-owned.

## Implementation Strategy

We will implement this in small vertical slices, verifying each slice before moving on.

### Slice 1: Backend bot capability

Create the backend `Bots` capability under the required clean architecture structure.

#### Domain layer

Location:

- `backend/aspnet-core/src/conversa-studio.Core/Domains/Bots/`

Add:

- bot aggregate
- bot status model
- graph contracts
- validation issue contract
- graph validator

The domain model must own:

- bot identity
- tenant ownership
- owner user ID
- bot name
- draft graph payload
- status
- draft version
- optional published version placeholder
- audit data

Validation must cover at minimum:

- exactly one start node
- unique valid node IDs
- edge references point to valid nodes
- required config exists by node type
- no broken references
- no unreachable orphan nodes
- valid branch structure baseline

#### Application layer

Location:

- `backend/aspnet-core/src/conversa-studio.Application/Services/Bots/`

Add:

- `IBotDefinitionAppService.cs`
- `BotDefinitionAppService.cs`
- `Dto/`

Required DTOs:

- `BotSummaryDto.cs`
- `BotDefinitionDto.cs`
- `BotGraphDto.cs`
- `CreateBotDefinitionRequest.cs`
- `UpdateBotDefinitionRequest.cs`
- `ValidateBotDefinitionRequest.cs`
- `BotValidationResultDto.cs`

App service responsibilities:

- list current user bots
- get bot by ID
- create draft bot
- update draft bot
- validate graph
- enforce tenant/user ownership
- map domain model to transport DTOs

#### Persistence layer

Location:

- `backend/aspnet-core/src/conversa-studio.EntityFrameworkCore/`

Required work:

- register bot entity in `ConversaStudioDbContext`
- configure table and indexes
- persist draft graph JSON
- add migration for bot storage

#### Authorization

Update:

- `backend/aspnet-core/src/conversa-studio.Core/Authorization/PermissionNames.cs`
- `backend/aspnet-core/src/conversa-studio.Core/Authorization/conversa-studioAuthorizationProvider.cs`

Add:

- `Pages_Bots`

#### Backend tests

Add app-service tests for:

- create draft bot
- update draft bot
- validate invalid graph
- list only current tenant/user bots

Add web/API tests for:

- authenticated create
- authenticated fetch

### Slice 2: Frontend bot provider

Create a bot persistence provider using the 4-file pattern.

Location:

- `frontend/src/providers/botProvider/`

Files:

- `context.tsx`
- `actions.tsx`
- `reducer.tsx`
- `index.tsx`

Responsibilities:

- fetch bot list
- fetch one bot
- initialize local new draft
- create bot on first save
- update persisted draft
- validate draft via backend
- keep active bot and save status

Bot provider state should include:

- `isPending`
- `isSuccess`
- `isError`
- `bots`
- `activeBot`
- `draftIdentity`
- `saveStatus`
- `validationResults`
- `errorMessage`

Bot provider actions should expose:

- `getBots`
- `getBot`
- `initializeNewBotDraft`
- `createBotDraft`
- `updateBotDraft`
- `validateBotDraft`
- `clearActiveBot`

### Slice 3: Frontend builder provider

Refactor builder editor state into its own 4-file provider.

Location:

- `frontend/src/components/developer/builder/provider/`

Files:

- `context.tsx`
- `actions.tsx`
- `reducer.tsx`
- `index.tsx`

Responsibilities:

- selection state
- node add/update/delete
- edge add/update/delete
- metadata edits such as bot name
- validation results in local editor state
- simulator drawer state
- reactflow mapping helpers
- local graph dirty tracking

Keep this provider separate from `botProvider`.

Rule:

- `botProvider` owns persistence and backend I/O
- `builder provider` owns editor interaction state only

### Slice 4: Compatibility layer

Replace the old monolithic builder context file with a compatibility export so existing imports do not all need to change at once.

Location:

- `frontend/src/components/developer/builder/builder-context.tsx`

Behavior:

- re-export from `./provider`

### Slice 5: Root provider wiring

Update the root layout to include the bot provider.

Location:

- `frontend/src/app/layout.tsx`

Wrap:

- `AuthProvider`
- `BotProvider`

### Slice 6: Projects page wiring

Replace the hardcoded project list with real bot data.

Location:

- `frontend/src/components/developer/ProjectsWorkspace.tsx`

Required UI states:

- loading
- empty
- error
- loaded bot cards

Each bot card should show:

- name
- draft/published status
- last updated timestamp

### Slice 7: Builder hydration and autosave

Update the builder workspace to:

- load `/new` from a temporary local draft
- load `/[id]` from the backend
- autosave after edits
- call create on first save from `/new`
- replace route after create succeeds
- call update on later saves
- expose manual save and manual validate

Location:

- `frontend/src/components/developer/BuilderWorkspace.tsx`

Required behavior:

- show spinner while loading existing bot
- show error state if bot load fails
- debounce autosave
- do not save invalid blocking graphs
- keep local edits if save fails

### Slice 8: Builder UI updates

Update toolbar and related components to match persistence behavior.

Needed changes:

- editable bot name field in toolbar
- save state tag
- keep manual save button
- remove “saved locally” wording

Potential files:

- `frontend/src/components/developer/builder/BuilderToolbar.tsx`
- `frontend/src/components/developer/builder/BuilderPropertiesPanel.tsx`
- `frontend/src/components/developer/builder/BuilderCanvas.tsx`
- `frontend/src/components/developer/builder/BuilderSimulatorDrawer.tsx`

### Slice 9: Migration and verification

After code is stable:

- generate EF migration for bot storage
- build backend
- run backend tests
- typecheck frontend
- run frontend build if needed

## Public Contracts

### Frontend provider contracts

#### botProvider

- `getBots`
- `getBot`
- `initializeNewBotDraft`
- `createBotDraft`
- `updateBotDraft`
- `validateBotDraft`
- `clearActiveBot`

#### builder provider

- add node
- update node
- delete node
- set selected node
- set selected edge
- update metadata
- update edges
- validate graph
- set simulator open
- mark saved
- reset graph

### Backend contracts

#### Bot summary

- `id`
- `name`
- `status`
- `updatedAt`

#### Bot definition

- `id`
- `name`
- `status`
- `draftVersion`
- `publishedVersion`
- `updatedAt`
- `graph`

#### Bot graph

- `metadata`
- `nodes`
- `edges`

#### Requests

- create draft
- update draft
- validate draft

#### Status values

- `Draft`
- `Published`

Frontend may normalize these to lowercase for UI use.

## Validation Rules

Validation must be enforced both for user experience and for persistence safety.

### Frontend validation

- run local graph validation for immediate feedback
- prevent autosave/manual save when blocking local issues exist

### Backend validation

- validate every create and update request
- do not trust frontend validation
- return structured validation issues for manual validate flows

## Test Plan

### Backend app service tests

- create draft bot persists tenant-scoped bot
- update draft bot rejects malformed graph
- get bots only returns current tenant/user bots
- validate draft returns errors for malformed graph

### Backend web/API tests

- authenticated tenant admin can create a bot
- authenticated tenant admin can fetch created bot

### Frontend verification

- projects page loads real bots
- empty projects page renders cleanly
- existing bot opens in builder
- `/developer/builder/new` does not create backend bot immediately
- first autosave creates backend bot and replaces route
- later autosaves update existing bot
- manual save works
- validation results are shown
- builder survives refresh on `/developer/builder/[id]`

## Known Risks

### Extension instability

This work touches many files across frontend and backend. To reduce the chance of IDE extension crashes or partial progress loss:

- implement one slice at a time
- verify after each slice
- checkpoint with git often
- avoid combining all code, migration, tests, and cleanup in one session

### Migration timing

The EF migration should be generated only after the entity shape is stable enough, otherwise repeated churn will create noisy migration history.

### Type alignment

The frontend builder graph types and backend graph DTO/domain types must stay aligned. Any status or config mismatch will cause save/hydration issues.

## Work Breakdown Checklist

### Phase A: Backend

- [ ] Create `Core/Domains/Bots/`
- [ ] Create graph validator
- [ ] Create application DTOs
- [ ] Create `IBotDefinitionAppService`
- [ ] Create `BotDefinitionAppService`
- [ ] Add bot permission
- [ ] Register bot entity in `ConversaStudioDbContext`
- [ ] Build backend successfully
- [ ] Add backend tests
- [ ] Generate EF migration

### Phase B: Frontend providers

- [ ] Create `frontend/src/providers/botProvider/`
- [ ] Create `frontend/src/components/developer/builder/provider/`
- [ ] Replace old builder context with compatibility export
- [ ] Add `BotProvider` to root layout
- [ ] Typecheck frontend providers

### Phase C: UI wiring

- [ ] Replace Projects page mock list
- [ ] Wire `/developer/builder/new`
- [ ] Wire `/developer/builder/[id]`
- [ ] Add autosave
- [ ] Add route replacement after first create
- [ ] Update save/validate UI states

### Phase D: Verification and cleanup

- [ ] Run backend build
- [ ] Run backend tests
- [ ] Run frontend typecheck
- [ ] Run frontend build
- [ ] Fix integration bugs
- [ ] Remove any leftover mock-only production flow usage

## Notes for Working Through This Plan

- Always reference this file before starting a new slice.
- Keep implementation changes small enough to verify in one pass.
- If a session terminates midway, resume by checking:
  - `git status`
  - which checklist items are complete
  - which slice was in progress

## Recommended Next Slice

Resume with:

1. inspect current partial repo state
2. finish backend `Bots` capability until backend build passes
3. only then continue to frontend provider/typecheck work

