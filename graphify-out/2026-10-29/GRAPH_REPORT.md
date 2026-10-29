# Graph Report - get_profile  (2026-10-29)

## Corpus Check
- 69 files · ~27,667 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 432 nodes · 1254 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `55964a05`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- onboarding.tsx
- Package Dependencies
- eventFlow.ts
- Admin Auth & Profiles API
- Project Docs & Onboarding Spec
- Icon
- json
- TypeScript Config
- vercel.json
- app/layout.tsx
- Brand Images

## God Nodes (most connected - your core abstractions)
1. `json()` - 46 edges
2. `fail()` - 36 edges
3. `Icon()` - 34 edges
4. `failWith()` - 26 edges
5. `react` - 20 edges
6. `createServerSupabaseClient()` - 20 edges
7. `ProfilePage()` - 18 edges
8. `digitsOnly()` - 18 edges
9. `requireAdmin()` - 17 edges
10. `next` - 16 edges

## Surprising Connections (you probably didn't know these)
- `generateStaticParams()` --calls--> `getAllEvents()`  [EXTRACTED]
  src/app/events/[slug]/page.tsx → src/lib/events.ts
- `Orbit Mark (White)` --conceptually_related_to--> `Crystal Question Mark`  [AMBIGUOUS]
  public/orbit-mark-white.png → public/images/crystal_question_mark.png
- `EventManagementTab()` --calls--> `Field()`  [EXTRACTED]
  src/app/admin/EventManagementTab.tsx → src/components/ui.tsx
- `EventManagementTab()` --calls--> `Icon()`  [EXTRACTED]
  src/app/admin/EventManagementTab.tsx → src/components/ui.tsx
- `Board` --references--> `OrbitEvent`  [EXTRACTED]
  src/app/admin/EventOpenManagementTab.tsx → src/types/event.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nine-step Onboarding Flow** — readme_step1_basic_info, readme_step2_gender_age, readme_step3_height_contact, readme_step4_region, readme_step5_animal_type, readme_step6_preferred_partner, readme_step7_self_intro, readme_step8_review, readme_step9_success [EXTRACTED 1.00]
- **Supabase Configuration and Deployment** — readme_supabase, readme_supabase_schema_sql, readme_supabase_env_vars, readme_env_local, readme_vercel_deployment [EXTRACTED 1.00]

## Communities (11 total, 1 thin omitted)

### Community 0 - "onboarding.tsx"
Cohesion: 0.08
Nodes (58): INITIAL_PROFILE, missingOnStep(), ProfilePage(), ViewMode, EventsSection(), ImageEditorModal(), LoginScreen(), Props (+50 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.06
Nodes (39): eslintConfig, dependencies, canvas-confetti@^1.9.4, next@16.4.2, react@19.3.0, react-dom@19.3.0, @supabase/supabase-js@^2.118.0, devDependencies (+31 more)

### Community 2 - "eventFlow.ts"
Cohesion: 0.10
Nodes (46): GET(), EventPage(), EventPageContent(), generateStaticParams(), Props, countByGender(), db(), deleteApplication() (+38 more)

### Community 3 - "Admin Auth & Profiles API"
Cohesion: 0.10
Nodes (40): adminCookie(), DELETE(), GET(), locked(), POST(), POST(), OCTOMO_API_KEY, POST() (+32 more)

### Community 4 - "Project Docs & Onboarding Spec"
Cohesion: 0.09
Nodes (25): generate-agent-files.js (next dev), node_modules/next/dist/docs, Next.js Agent Rules, canvas-confetti, Character Counter, .env.local, Local Dev Server (npm run dev), Multi-step Profile Onboarding Flow (+17 more)

### Community 5 - "Icon"
Cohesion: 0.05
Nodes (72): nextConfig, next, react, DEADLINES, Draft, EventManagementTab(), fromLocalInput(), Props (+64 more)

### Community 7 - "json"
Cohesion: 0.11
Nodes (51): DELETE(), GET(), DELETE(), GET(), POST(), POST(), PATCH(), DELETE() (+43 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "vercel.json"
Cohesion: 0.50
Nodes (3): crons, framework, $schema

### Community 11 - "app/layout.tsx"
Cohesion: 0.33
Nodes (3): metadata, serif, viewport

## Ambiguous Edges - Review These
- `Crystal Question Mark` → `Orbit Mark (White)`  [AMBIGUOUS]
  public/orbit-mark-white.png · relation: conceptually_related_to

## Knowledge Gaps
- **8 isolated node(s):** `Crystal Question Mark`, `Orbit Mark (White)`, `canvas-confetti`, `Phone Number Auto-hyphen Formatting`, `Step 1: Basic Info (Name, Nickname)` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 107 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Icon` to `Package Dependencies`, `eventFlow.ts`, `app/layout.tsx`, `json`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **What connects `Crystal Question Mark`, `Orbit Mark (White)`, `canvas-confetti` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `onboarding.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08384547848990342 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Icon` to `onboarding.tsx`, `Package Dependencies`, `eventFlow.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06039488966318235 - nodes in this community are weakly interconnected._
- **Why does `digitsOnly()` connect `onboarding.tsx` to `eventFlow.ts`, `Admin Auth & Profiles API`, `json`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Crystal Question Mark` and `Orbit Mark (White)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._