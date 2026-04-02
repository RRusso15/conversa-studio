# Conversa Studio Backend - Architecture & Folder Structure Guide

## Overview

The Conversa Studio backend is a multi-tenant SaaS platform built on ASP.NET Boilerplate (ABP). It follows a layered modular-monolith structure that separates domain logic, application orchestration, persistence, shared web infrastructure, and the runnable API host.

This document is the canonical backend structure guide for this repository. It defines where new backend features belong and how they should be added without renaming the existing `conversa-studio.*` projects.

## Solution Structure

```text
backend/aspnet-core/
├── src/
│   ├── conversa-studio.Core/                 # Domain layer
│   ├── conversa-studio.Application/          # Application service layer
│   ├── conversa-studio.EntityFrameworkCore/  # Data access / infrastructure layer
│   ├── conversa-studio.Web.Core/             # Shared web infrastructure
│   ├── conversa-studio.Web.Host/             # API host / startup project
│   └── conversa-studio.Migrator/             # Standalone migration runner
├── test/
│   ├── conversa-studio.Tests/                # Unit and integration tests
│   └── conversa-studio.Web.Tests/            # Web / HTTP-level tests
└── conversa-studio.sln
```

## Layer Dependencies

Dependency direction is one-way:

```text
Web.Host
  └── Web.Core
        └── Application
              ├── Core
              └── EntityFrameworkCore
                    └── Core
```

Rules:

- No project may reference a layer above it.
- Project renaming is out of scope and unnecessary.
- We adopt the structure and conventions described here without renaming existing assemblies, namespaces, solution files, or modules.

## Layer Breakdown

### 1. `conversa-studio.Core` - Domain Layer

Purpose:

- Owns business entities, value objects, domain services, invariants, and cross-cutting domain concerns.
- Must not depend on application services, EF Core infrastructure, or HTTP concerns.

Current solution areas already present here include:

- `Authorization/`
- `Configuration/`
- `Editions/`
- `Features/`
- `Identity/`
- `Localization/`
- `MultiTenancy/`
- `Timing/`
- `Validation/`

Future product-domain work should be organized under:

```text
conversa-studio.Core/
├── Domains/
│   ├── Analytics/
│   ├── Billing/
│   ├── Bots/
│   ├── Channels/
│   ├── Collaboration/
│   ├── Deployments/
│   ├── Integrations/
│   ├── Knowledge/
│   ├── Runtime/
│   ├── Templates/
│   └── Transcripts/
```

Examples of what belongs here:

- `Bots`: bot definitions, graph versions, publishing rules, validation rules
- `Runtime`: state machine execution primitives, runtime session state, variable handling
- `Knowledge`: knowledge-base metadata, source ingestion models, AI grounding policies
- `Deployments`: widget deployments, channel deployment configuration
- `Channels`: normalized channel envelopes and channel-specific abstractions
- `Transcripts`: conversation records, message events, retention rules
- `Analytics`: summary aggregates, usage counters, drop-off and fallback metrics
- `Templates`: reusable starter bot definitions and template metadata
- `Integrations`: integration definitions and integration domain rules
- `Collaboration`: memberships, roles, workspace collaboration rules

Rules:

- Keep domain logic in the domain layer, not in app services.
- Prefer entity and domain-service boundaries that map to product capabilities.
- Put shared domain validation here when it is not transport-specific.
- Multi-tenancy must be considered from the start for new domain entities and workflows.

### 2. `conversa-studio.Application` - Application Service Layer

Purpose:

- Orchestrates use cases.
- Exposes application services to the web layer.
- Holds DTOs, mapping profiles, and permission-protected use-case workflows.

Current solution areas already present here include:

- `Authorization/Accounts/`
- `Configuration/`
- `MultiTenancy/`
- `Roles/`
- `Sessions/`
- `Users/`

Future product-domain work should be organized under:

```text
conversa-studio.Application/
├── Services/
│   ├── Analytics/
│   ├── Billing/
│   ├── Bots/
│   ├── Channels/
│   ├── Collaboration/
│   ├── Deployments/
│   ├── Integrations/
│   ├── Knowledge/
│   ├── Runtime/
│   ├── Templates/
│   └── Transcripts/
```

Feature placement rules:

- Domain entities and domain services live in `Core/Domains/<Capability>/`.
- App services and DTOs live under `Application/Services/<Capability>/`.
- A typical feature shape is:

```text
Application/Services/Bots/BotDefinitionService/
├── IBotDefinitionAppService.cs
├── BotDefinitionAppService.cs
└── Dto/
    ├── BotDefinitionDto.cs
    ├── CreateBotDefinitionDto.cs
    └── UpdateBotDefinitionDto.cs
```

Rules:

- Every app service should have a matching interface.
- App services orchestrate use cases and permissions, but should not own business invariants that belong in the domain.
- DTOs must stay out of the domain layer.
- Persistence should be accessed through repository abstractions, not directly from controllers.

### 3. `conversa-studio.EntityFrameworkCore` - Data Access / Infrastructure Layer

Purpose:

- Owns EF Core persistence, migrations, seeding, and database configuration.
- Registers database access for domain entities.

Current key files:

- `EntityFrameworkCore/conversa-studioDbContext.cs`
- `EntityFrameworkCore/conversa-studioDbContextConfigurer.cs`
- `EntityFrameworkCore/conversa-studioDbContextFactory.cs`
- `EntityFrameworkCore/AbpZeroDbMigrator.cs`
- `EntityFrameworkCore/Repositories/`
- `EntityFrameworkCore/Seed/`
- `Migrations/`

Rules:

- Each persisted domain entity must be registered in `conversa-studioDbContext`.
- Use `OnModelCreating` for configuration that should not live in annotations.
- New migrations belong here.
- This layer supports PostgreSQL-backed persistence and can later include infrastructure extensions such as Redis-backed caching where appropriate.

### 4. `conversa-studio.Web.Core` - Shared Web Infrastructure

Purpose:

- Provides shared web concerns used by the host and tests.
- Handles token auth, shared controller base classes, request models, and web infrastructure plumbing.

Current key areas:

- `Authentication/External/`
- `Authentication/JwtBearer/`
- `Controllers/`
- `Models/`

Rules:

- Keep transport and auth plumbing here.
- Do not put business rules here.
- Shared request/response transport models may live here when they are specifically web-facing.

### 5. `conversa-studio.Web.Host` - Presentation / API Host Layer

Purpose:

- Startup project and runnable host.
- Configures middleware, CORS, Swagger, SignalR, and application startup.

Current key pieces:

- `Startup/Program.cs`
- `Startup/Startup.cs`
- `Startup/conversa-studioWebHostModule.cs`
- `Controllers/`
- `appsettings.json`
- `wwwroot/swagger/ui/`

Current runtime concerns already present:

- JWT authentication
- Swagger / OpenAPI
- SignalR
- CORS
- ABP startup and middleware wiring

Rules:

- No business logic belongs here.
- Controllers and startup code should delegate to application services and infrastructure.
- Configuration changes should be environment-aware and not hardcode deployment secrets.

### 6. `conversa-studio.Migrator` - Database Migration Runner

Purpose:

- Applies pending database migrations without running the full web host.

Current key files:

- `Program.cs`
- `conversa-studioMigratorModule.cs`
- `appsettings.json`

### 7. Test Projects

```text
test/
├── conversa-studio.Tests/
└── conversa-studio.Web.Tests/
```

Rules:

- Domain and application behavior should be covered in `conversa-studio.Tests`.
- HTTP and web-host behavior should be covered in `conversa-studio.Web.Tests`.
- New feature tests should mirror the feature area they validate.

## Product Domain Boundaries

Conversa Studio is not modeled as a traditional line-of-business system. New backend work should reflect these capability groups:

- `Bots`
- `Runtime`
- `Knowledge`
- `Deployments`
- `Channels`
- `Transcripts`
- `Analytics`
- `Templates`
- `Integrations`
- `Billing`
- `Collaboration`

Builder ownership rule:

- The visual drag-and-drop builder is primarily a frontend/editor concern.
- The backend owns bot definitions, graph validation, bot versioning, publishing, execution contracts, and runtime behavior.
- Do not create a separate backend `Builder` domain by default unless a future need clearly justifies it.

## Core Backend Contracts

New features should preserve typed contracts around:

- bot definitions and graph schema
- node configuration contracts
- runtime session state
- normalized channel input/output payloads
- transcript records
- analytics and usage records
- deployment configuration
- template definitions

These contracts should be designed for extensibility across channels and tenants.

## Bot Graph Validation Rules

Whenever bot graphs are saved, published, generated, or executed, validate at minimum:

- exactly one start node exists
- node IDs are unique and valid
- edge references point to valid nodes
- required config is present for each node type
- no orphaned or broken references exist
- branch structures are valid
- generated graphs pass validation before they can be published or executed

Validation belongs primarily in backend-owned domain/application logic, not only in the frontend builder.

## Feature Placement Rules

When implementing a new backend feature:

1. Define domain entities, value objects, and domain services in `Core/Domains/<Capability>/`.
2. Register persisted entities in `conversa-studioDbContext`.
3. Add or update migrations in `conversa-studio.EntityFrameworkCore`.
4. Add DTOs and app services in `Application/Services/<Capability>/`.
5. Expose functionality through the application layer and host infrastructure as appropriate.
6. Add tests under the matching test project.

Do not:

- place DTOs in the domain layer
- place business rules in `Web.Core` or `Web.Host`
- skip graph validation for generated or AI-assisted bot definitions
- couple channel-specific payloads directly to domain entities without a normalized internal contract

## Priority Guidance

When choosing where to invest design effort first, align backend work to the current product priorities:

1. Strong builder support through backend-owned bot definition contracts
2. Reliable runtime engine
3. Website widget deployment
4. Variables and personalization
5. AI knowledge node support
6. Templates and prompt-to-bot generation
7. Admin transcripts and analytics
8. Billing, integrations, and collaboration after core flow works

The first major backend-centered business domains should usually be `Bots` and `Runtime`.

## Notes

- Existing starter-template areas such as `Users`, `Roles`, `Sessions`, and `MultiTenancy` remain valid.
- This guide governs new product-domain development going forward; it does not require an immediate full refactor of the existing codebase.
- Redis is optional and should be treated as a supporting infrastructure extension rather than a baseline requirement.
