
# Conversa Studio

## What is Conversa Studio?

Conversa Studio is a chatbot builder and deployment platform for designing, publishing, and managing conversational experiences. It gives developers and admins a visual flow builder, prompt-to-bot generation, reusable templates, web widget deployments, transcripts, analytics, AI knowledge configuration, and human handoff support.

## Why Choose Conversa Studio?

Visual Bot Building: Design chatbot flows through a structured builder with nodes for messaging, questions, conditions, variables, APIs, AI, code, handoff, and end states.

Prompt-to-Bot Creation: Generate bot drafts from natural language prompts and refine them in the builder.

Reusable Templates: Admins can create and publish templates that developers can use as starting points for new bots.

Deployment Ready: Publish bots and expose them through web widget deployments with environment-aware backend hosting.

Operational Visibility: Review transcripts, inspect runtime sessions, and monitor usage through analytics dashboards.

AI Knowledge Support: Configure bot-scoped AI settings and attach text, URL, or PDF knowledge sources for retrieval-backed experiences.

# Documentation

## Software Requirement Specification

### Overview

Conversa Studio supports two primary user roles: `Admin` and `Developer`. Admins manage the platform and reusable assets such as templates and admin access. Developers create, edit, publish, deploy, and monitor bots for their tenant. The system is split into a Next.js frontend and an ASP.NET Boilerplate backend with PostgreSQL persistence.

### Components and functional requirements

**1. Authentication and authorization management**

- user can sign up as a developer
- user can log in with tenant-aware authentication
- admin and developer access is separated by role
- authenticated users can access protected workspaces

**2. Bot management subsystem**

- developer can create a bot from a blank canvas
- developer can create a bot from a published template
- developer can generate a bot from a prompt
- developer can edit, validate, save, publish, and export bot definitions

**3. Template management subsystem**

- admin can create templates from scratch
- admin can generate templates with AI
- admin can edit draft templates in the builder
- admin can publish and unpublish templates for developer use

**4. Deployment subsystem**

- developer can create a deployment for a published bot
- developer can configure widget deployment settings
- developer can activate or deactivate deployments
- external clients can bootstrap and use the widget through a deployment key

**5. Runtime and transcript subsystem**

- widget users can start and continue conversation sessions
- runtime sessions can store current node, variables, and completion state
- transcript messages are recorded for bot and user exchanges
- developers can inspect transcript sessions and message histories

**6. Analytics subsystem**

- developers can view analytics overview metrics
- developers can inspect timeseries trends
- developers can filter analytics by bot and date range
- developers can review conversation breakdowns

**7. AI knowledge subsystem**

- developer can configure bot AI provider settings
- developer can add text, URL, and PDF knowledge sources
- developer can view ingestion status for each source
- AI-enabled bots can use configured knowledge during runtime

**8. Human handoff subsystem**

- developer can configure bot-level handoff inboxes
- handoff nodes can route a session to a named inbox
- widget can trigger handoff notification delivery
- transcript context can be included in the handoff email flow

### Architecture diagram

Backend architecture guidance is documented in [backend/aspnet-core/BACKEND_STRUCTURE.md](backend/aspnet-core/BACKEND_STRUCTURE.md).

# Design

## Figma Designs

`https://www.figma.com/design/pREYUI4vN79hEvbsA5Qfia/Russell-Masimba-s-team-library?node-id=0-1&t=nfUMmQTS7u6CAmdh-1`

## Domain Model

The current conceptual domain model is captured in [https://drive.google.com/file/d/1Io1lajHuU34lxRi8Yb7Ist1P6C_uscke/view?usp=sharing](conversa_domain_model.drawio).

## Notes

- Bot and template graph structures are modeled conceptually and are stored as graph JSON rather than as fully normalized relational entities.

# Running the application

## Prerequisites

- Node.js and npm
- .NET 9 SDK
- PostgreSQL

## Frontend

From `frontend/`:

```bash
npm install
```

Create a local `.env` file when needed:

```env
NEXT_PUBLIC_DEFAULT_TENANCY_NAME=developer
```

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

Lint:

```bash
npm run lint
```

## Backend

From `backend/aspnet-core/`:

```bash
dotnet restore conversa-studio.sln
```

Update the database:

```bash
dotnet ef database update --project src/conversa-studio.EntityFrameworkCore/conversa-studio.EntityFrameworkCore.csproj --startup-project src/conversa-studio.Web.Host/conversa-studio.Web.Host.csproj
```

Run the backend host:

```bash
dotnet run --project src/conversa-studio.Web.Host/conversa-studio.Web.Host.csproj
```

Alternative migration runner:

```bash
dotnet run --project src/conversa-studio.Migrator/conversa-studio.Migrator.csproj
```

Default local backend settings are defined in [backend/aspnet-core/src/conversa-studio.Web.Host/appsettings.json](backend/aspnet-core/src/conversa-studio.Web.Host/appsettings.json).

## Production deployment

Backend deployment notes and Ubuntu/server setup are documented in [backend/aspnet-core/DEPLOYMENT.md](backend/aspnet-core/DEPLOYMENT.md).

# Project structure

```text
conversa-studio/
|-- backend/aspnet-core/   # ABP backend, domain, app services, EF Core, host, migrator
|-- frontend/              # Next.js frontend, builder UI, admin and developer workspaces
|-- docs/                  # Supporting project documentation
```

# Quality and standards

- Frontend uses Next.js, TypeScript, Ant Design, and ESLint.
- Backend follows the layered architecture described in `BACKEND_STRUCTURE.md`.
- Domain naming and capability boundaries are aligned around bots, templates, deployments, runtime, transcripts, analytics, and AI knowledge.
