# SYSTEM ARCHITECTURE

## 1. Tech Stack Strategy

- **Framework:** Next.js 14+ (App Router).
- **Database:** PostgreSQL (Supabase/Neon).
- **ORM:** Prisma (Strict Relations).
- **Language:** TypeScript (Strict Mode).
- **Styling:** Tailwind CSS + Shadcn/UI (Radix Primitives).
- **State:** \* _Server:_ React Query (Tanstack Query) - heavily used for caching.
  - _Client:_ Zustand - for complex flows (like the Match Runner).
- **Image Gen:** `@vercel/og` (Edge Runtime).

## 2. Domain-Driven Design (DDD) & Folder Structure

We enforce a strict separation of concerns within the `src/` directory.

```text
src/
├── app/
│   ├── (marketing)/        # Landing page, Pricing
│   ├── (auth)/             # Login, Sign up, Forgot Password
│   ├── (dashboard)/        # PROTECTED (Admin/Referee)
│   │   ├── [orgSlug]/      # Multi-tenant Context
│   │   │   ├── championships/
│   │   │   ├── teams/
│   │   │   ├── match-runner/[matchId]/ # Mobile-first interface
│   ├── (public)/           # PUBLIC (Parents/Fans)
│   │   ├── c/[slug]/       # Championship Portal (Standings, Fixtures)
│   │   ├── form/[id]/      # Registration Forms
│   ├── api/
│       ├── og/             # Image Generation Endpoint
├── core/                   # BUSINESS LOGIC (Framework Agnostic)
│   ├── domain/             # Types and Interfaces
│   ├── use-cases/          # Pure logic (e.g., "GenerateBracket", "CalculateTable")
├── lib/
│   ├── db/                 # Prisma Client
│   ├── actions/            # Server Actions (Mutations)
├── components/
│   ├── match/              # Match specific UI (Scoreboard, Timer)
│   ├── ui/                 # Shadcn Shared Components
```

3. Data Flow & Patterns
   A. The "Match Engine" (Event Sourcing Lite)
   We do not just update a score 2-1. We store Events.

Action: Referee taps "Goal".

DB Write: Insert into MatchEvent (type: GOAL, minute: 45, playerId: X).

Trigger: Database/Service calculates aggregated score and updates Match table for fast read access.

UI: Optimistic update on client (React Query) -> Server revalidates.

B. The "Viral Card" (Edge Generation)
Input: Player Name, Team Color, Photo URL.

Process: @vercel/og renders a React component into a PNG buffer.

Output: Image is cached at the Edge and served to meta tags (Open Graph).

C. Multi-Tenancy (Security)
Rule: Every database query in (dashboard) MUST include where: { organizationId: session.orgId }.

Middleware: Checks strict correlation between User and Organization before rendering layout.

4. Critical Dependencies
   zod: For strict schema validation on ALL inputs.

date-fns: For all time manipulation.

recharts: For stats visualization.

---

### 3. File: `.cursorrules`

_This file instructs the AI on "Behavior" and "Code Quality". It acts as the Senior Code Reviewer._

```markdown
# INSTRUCTIONS FOR CLAUDE / AI ASSISTANT

You are the **Lead Software Architect** for "SoccerFlow". You are responsible for maintaining code quality, scalability, and the "unique" user experience.

## 1. CODING STANDARDS

- **Strict TypeScript:** No `any`. Define interfaces in `core/domain`.
- **Modern Next.js:** Use Server Components by default. Use Client Components (`"use client"`) only for interactivity.
- **Data Fetching:** Prefer Server Actions for mutations. Use React Query for complex client-side data needs (like the live match runner).
- **Styling:** Use Tailwind Utility classes. Don't create custom CSS files. Use `cn()` for class merging.
- **Safety:** Always use `zod` to validate forms and API routes.

## 2. BEHAVIORAL RULES

- **Don't just code:** Before writing a complex feature, briefly explain your plan (Step 1, Step 2...).
- **Critique:** If I ask for something that will break scalability (e.g., "fetch all users without pagination"), STOP and correct me.
- **Context Aware:** Always check `ARCHITECTURE.md` before suggesting a folder structure.
- **Mobile First:** Remember the Referee is using this on a phone. UI buttons must be touch-friendly (min 44px height).

## 3. FEATURE IMPLEMENTATION GUIDES

### When building "Match Runner":

- Prioritize speed. The UI must react instantly.
- Suggest "Optimistic Updates" code patterns.

### When building "Forms":

- Think "Conversion". The form should be split into steps if it's long.
- Always implement the "Viral Card" generation logic on success.

## 4. COMMANDS

- If I type `/refactor`: Analyze the selected code for clean architecture violations.
- If I type `/db`: Suggest Prisma schema improvements based on the feature request.
```
