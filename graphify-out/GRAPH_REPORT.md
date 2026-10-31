# Graph Report - get_profile  (2026-10-31)

## Corpus Check
- 80 files · ~32,397 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .css 3, .example 1)

## Summary
- 472 nodes · 1396 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb709259`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- onboarding.tsx
- Package Dependencies
- eventFlow.ts
- Admin Auth & Profiles API
- Project Docs & Onboarding Spec
- app/layout.tsx
- check-supabase-key.mjs
- json
- TypeScript Config
- vercel.json
- migrate-photo-paths.mjs
- EventManagementTab.tsx
- Orbit Mark (White)
- README.md
- proxy.ts
- event-room-v2/README.md

## God Nodes (most connected - your core abstractions)
1. `json()` - 47 edges
2. `failWith()` - 39 edges
3. `Icon()` - 36 edges
4. `fail()` - 34 edges
5. `createServerSupabaseClient()` - 22 edges
6. `react` - 20 edges
7. `digitsOnly()` - 20 edges
8. `ProfilePage()` - 19 edges
9. `FlowError` - 19 edges
10. `next` - 17 edges

## Surprising Connections (you probably didn't know these)
- `EventManagementTab()` --calls--> `Field()`  [EXTRACTED]
  src/app/admin/EventManagementTab.tsx → src/components/ui.tsx
- `EventManagementTab()` --calls--> `Icon()`  [EXTRACTED]
  src/app/admin/EventManagementTab.tsx → src/components/ui.tsx
- `EventManagementTab()` --calls--> `addDays()`  [EXTRACTED]
  src/app/admin/EventManagementTab.tsx → src/lib/eventStages.ts
- `Board` --references--> `OrbitEvent`  [EXTRACTED]
  src/app/admin/EventOpenManagementTab.tsx → src/types/event.ts
- `EventOpenManagementTab()` --calls--> `Icon()`  [EXTRACTED]
  src/app/admin/EventOpenManagementTab.tsx → src/components/ui.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nine-step Onboarding Flow** — readme_step1_basic_info, readme_step2_gender_age, readme_step3_height_contact, readme_step4_region, readme_step5_animal_type, readme_step6_preferred_partner, readme_step7_self_intro, readme_step8_review, readme_step9_success [EXTRACTED 1.00]
- **Supabase Configuration and Deployment** — readme_supabase, readme_supabase_schema_sql, readme_supabase_env_vars, readme_env_local, readme_vercel_deployment [EXTRACTED 1.00]

## Communities (16 total, 4 thin omitted)

### Community 0 - "onboarding.tsx"
Cohesion: 0.07
Nodes (73): react, AdminLogin(), INITIAL_PROFILE, missingOnStep(), ProfilePage(), ViewMode, BottomNav(), MainTab (+65 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.08
Nodes (32): eslintConfig, dependencies, canvas-confetti@^1.9.4, next@16.4.2, react@19.3.0, react-dom@19.3.0, @supabase/supabase-js@^2.118.0, devDependencies (+24 more)

### Community 2 - "eventFlow.ts"
Cohesion: 0.07
Nodes (63): EventPage(), EventPageContent(), FALLBACK_PARAMS, generateStaticParams(), Props, countByGender(), db(), findApplication() (+55 more)

### Community 3 - "Admin Auth & Profiles API"
Cohesion: 0.11
Nodes (43): adminCookie(), DELETE(), GET(), locked(), POST(), POST(), OCTOMO_API_KEY, POST() (+35 more)

### Community 4 - "Project Docs & Onboarding Spec"
Cohesion: 0.09
Nodes (25): generate-agent-files.js (next dev), node_modules/next/dist/docs, Next.js Agent Rules, canvas-confetti, Character Counter, .env.local, Local Dev Server (npm run dev), Multi-step Profile Onboarding Flow (+17 more)

### Community 5 - "app/layout.tsx"
Cohesion: 0.33
Nodes (3): metadata, serif, viewport

### Community 7 - "json"
Cohesion: 0.13
Nodes (46): @supabase/supabase-js, DELETE(), GET(), DELETE(), GET(), POST(), POST(), PATCH() (+38 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "vercel.json"
Cohesion: 0.50
Nodes (3): crons, framework, $schema

### Community 10 - "migrate-photo-paths.mjs"
Cohesion: 0.29
Nodes (4): apply, db, key, url

### Community 11 - "EventManagementTab.tsx"
Cohesion: 0.06
Nodes (68): nextConfig, securityHeaders, next, DEADLINES, Draft, EventManagementTab(), fromLocalInput(), Props (+60 more)

### Community 14 - "proxy.ts"
Cohesion: 0.67
Nodes (3): config, hostOf(), proxy()

## Knowledge Gaps
- **7 isolated node(s):** `Orbit Mark (White)`, `canvas-confetti`, `Phone Number Auto-hyphen Formatting`, `Step 1: Basic Info (Name, Nickname)`, `Step 4: Region Selector (Sido / Sigungu)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 123 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `EventManagementTab.tsx` to `Package Dependencies`, `eventFlow.ts`, `app/layout.tsx`, `json`, `proxy.ts`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **What connects `Orbit Mark (White)`, `canvas-confetti`, `Phone Number Auto-hyphen Formatting` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `onboarding.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06504702194357367 - nodes in this community are weakly interconnected._
- **Why does `react` connect `onboarding.tsx` to `Package Dependencies`, `eventFlow.ts`, `EventManagementTab.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0766488413547237 - nodes in this community are weakly interconnected._
- **Why does `digitsOnly()` connect `onboarding.tsx` to `Admin Auth & Profiles API`, `json`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `eventFlow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07120500782472614 - nodes in this community are weakly interconnected._