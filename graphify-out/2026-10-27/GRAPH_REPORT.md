# Graph Report - funny-bell-405a1a  (2026-10-27)

## Corpus Check
- 57 files · ~22,490 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .ico 1)

## Summary
- 358 nodes · 966 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54a1a3e7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- onboarding.tsx
- Package Dependencies
- applications.ts
- Admin Auth & Profiles API
- Project Docs & Onboarding Spec
- Icon
- digitsOnly
- json
- TypeScript Config
- vercel.json
- admin/layout.tsx
- app/layout.tsx
- Brand Images

## God Nodes (most connected - your core abstractions)
1. `json()` - 37 edges
2. `fail()` - 33 edges
3. `Icon()` - 29 edges
4. `errorMessage()` - 28 edges
5. `digitsOnly()` - 23 edges
6. `ProfilePage()` - 18 edges
7. `Field()` - 17 edges
8. `requireAdmin()` - 16 edges
9. `compilerOptions` - 16 edges
10. `react` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Orbit Mark (White)` --conceptually_related_to--> `Crystal Question Mark`  [AMBIGUOUS]
  public/orbit-mark-white.png → public/images/crystal_question_mark.png
- `EventManagementTab()` --calls--> `Field()`  [EXTRACTED]
  src/app/admin/EventManagementTab.tsx → src/components/ui.tsx
- `AdminLogin()` --calls--> `Field()`  [EXTRACTED]
  src/app/admin/page.tsx → src/components/ui.tsx
- `locked()` --calls--> `json()`  [EXTRACTED]
  src/app/api/admin/auth/route.ts → src/lib/http.ts
- `GET()` --calls--> `json()`  [EXTRACTED]
  src/app/api/admin/auth/route.ts → src/lib/http.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nine-step Onboarding Flow** — readme_step1_basic_info, readme_step2_gender_age, readme_step3_height_contact, readme_step4_region, readme_step5_animal_type, readme_step6_preferred_partner, readme_step7_self_intro, readme_step8_review, readme_step9_success [EXTRACTED 1.00]
- **Supabase Configuration and Deployment** — readme_supabase, readme_supabase_schema_sql, readme_supabase_env_vars, readme_env_local, readme_vercel_deployment [EXTRACTED 1.00]

## Communities (13 total, 3 thin omitted)

### Community 0 - "onboarding.tsx"
Cohesion: 0.08
Nodes (53): INITIAL_PROFILE, missingOnStep(), ProfilePage(), ViewMode, ImageEditorModal(), LoginScreen(), Props, Status (+45 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.06
Nodes (38): eslintConfig, dependencies, canvas-confetti@^1.9.4, next@16.4.2, react@19.3.0, react-dom@19.3.0, @supabase/supabase-js@^2.118.0, devDependencies (+30 more)

### Community 2 - "applications.ts"
Cohesion: 0.11
Nodes (30): POST(), EventPage(), EventPageContent(), generateStaticParams(), Props, createApplication(), dataFilePath, deleteApplication() (+22 more)

### Community 3 - "Admin Auth & Profiles API"
Cohesion: 0.17
Nodes (25): adminCookie(), DELETE(), GET(), locked(), POST(), ADMIN_COOKIE_NAME, checkRateLimit(), createAdminSessionToken() (+17 more)

### Community 4 - "Project Docs & Onboarding Spec"
Cohesion: 0.09
Nodes (25): generate-agent-files.js (next dev), node_modules/next/dist/docs, Next.js Agent Rules, canvas-confetti, Character Counter, .env.local, Local Dev Server (npm run dev), Multi-step Profile Onboarding Flow (+17 more)

### Community 5 - "Icon"
Cohesion: 0.08
Nodes (49): nextConfig, next, react, Draft, EventManagementTab(), Props, APP_STATUS, EventOpenManagementTab() (+41 more)

### Community 6 - "digitsOnly"
Cohesion: 0.29
Nodes (11): POST(), OCTOMO_API_KEY, POST(), verifiedResponse(), digitsOnly(), createMemberSessionToken(), isMemberAuthConfigured(), MEMBER_COOKIE_NAME (+3 more)

### Community 7 - "json"
Cohesion: 0.15
Nodes (38): @supabase/supabase-js, DELETE(), GET(), PATCH(), DELETE(), GET(), POST(), PATCH() (+30 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 11 - "app/layout.tsx"
Cohesion: 0.33
Nodes (3): metadata, serif, viewport

## Ambiguous Edges - Review These
- `Crystal Question Mark` → `Orbit Mark (White)`  [AMBIGUOUS]
  public/orbit-mark-white.png · relation: conceptually_related_to

## Knowledge Gaps
- **8 isolated node(s):** `Crystal Question Mark`, `Orbit Mark (White)`, `canvas-confetti`, `Phone Number Auto-hyphen Formatting`, `Step 1: Basic Info (Name, Nickname)` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 99 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Icon` to `Package Dependencies`, `applications.ts`, `json`, `admin/layout.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **What connects `Crystal Question Mark`, `Orbit Mark (White)`, `canvas-confetti` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `onboarding.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08192090395480225 - nodes in this community are weakly interconnected._
- **Why does `digitsOnly()` connect `digitsOnly` to `onboarding.tsx`, `applications.ts`, `Icon`, `json`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06097560975609756 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Icon` to `onboarding.tsx`, `Package Dependencies`, `applications.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Crystal Question Mark` and `Orbit Mark (White)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._