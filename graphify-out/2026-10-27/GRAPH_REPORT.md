# Graph Report - get_profile  (2026-10-26)

## Corpus Check
- Corpus is ~44,670 words - fits in a single context window. You may not need a graph.

## Summary
- 313 nodes · 543 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Profile Onboarding UI
- Package Dependencies
- Events API & Admin Layout
- Admin Auth & Profiles API
- Project Docs & Onboarding Spec
- Event Management Components
- Applications Data & Seeding
- Supabase Profile & Upload API
- TypeScript Config
- Vercel Deploy Config
- Starter SVG Assets
- Root Layout
- Brand Images

## God Nodes (most connected - your core abstractions)
1. `next` - 23 edges
2. `react` - 16 edges
3. `compilerOptions` - 16 edges
4. `ProfilePage()` - 15 edges
5. `checkAdminAuth()` - 12 edges
6. `getAllEvents()` - 10 edges
7. `ProfileData` - 10 edges
8. `Multi-step Profile Onboarding Flow` - 10 edges
9. `@supabase/supabase-js` - 8 edges
10. `POST()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `File Document Icon` --conceptually_related_to--> `create-next-app Starter Assets`  [INFERRED]
  public/file.svg → public/next.svg
- `Globe Icon` --conceptually_related_to--> `create-next-app Starter Assets`  [INFERRED]
  public/globe.svg → public/next.svg
- `Orbit Mark (White)` --conceptually_related_to--> `Crystal Question Mark`  [AMBIGUOUS]
  public/orbit-mark-white.png → public/images/crystal_question_mark.png
- `Vercel Triangle Logo` --conceptually_related_to--> `create-next-app Starter Assets`  [INFERRED]
  public/vercel.svg → public/next.svg
- `Browser Window Icon` --conceptually_related_to--> `create-next-app Starter Assets`  [INFERRED]
  public/window.svg → public/next.svg

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nine-step Onboarding Flow** — readme_step1_basic_info, readme_step2_gender_age, readme_step3_height_contact, readme_step4_region, readme_step5_animal_type, readme_step6_preferred_partner, readme_step7_self_intro, readme_step8_review, readme_step9_success [EXTRACTED 1.00]
- **Supabase Configuration and Deployment** — readme_supabase, readme_supabase_schema_sql, readme_supabase_env_vars, readme_env_local, readme_vercel_deployment [EXTRACTED 1.00]
- **Next.js starter icon set (file, globe, window)** — public_file_file_icon, public_globe_globe_icon, public_window_window_icon [INFERRED 0.85]

## Communities (13 total, 2 thin omitted)

### Community 0 - "Profile Onboarding UI"
Cohesion: 0.06
Nodes (45): react, INITIAL_PROFILE, MainTab, ProfilePage(), STEP_TITLES, ViewMode, ImageEditorModal(), LoginScreen() (+37 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.06
Nodes (37): eslintConfig, dependencies, canvas-confetti@^1.9.4, next@16.4.2, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+29 more)

### Community 2 - "Events API & Admin Layout"
Cohesion: 0.10
Nodes (25): nextConfig, next, metadata, DELETE(), GET(), POST(), PATCH(), POST() (+17 more)

### Community 3 - "Admin Auth & Profiles API"
Cohesion: 0.12
Nodes (30): GET(), POST(), securityHeaders, AdminProfileRecord, DELETE(), GET(), isConfigured, normalizeAdminProfile() (+22 more)

### Community 4 - "Project Docs & Onboarding Spec"
Cohesion: 0.09
Nodes (25): generate-agent-files.js (next dev), node_modules/next/dist/docs, Next.js Agent Rules, canvas-confetti, Character Counter, .env.local, Local Dev Server (npm run dev), Multi-step Profile Onboarding Flow (+17 more)

### Community 5 - "Event Management Components"
Cohesion: 0.13
Nodes (17): EventManagementTab(), Props, EventOpenManagementTab(), Props, AdminPage(), ProfileRecord, StatsData, EventDetailClient() (+9 more)

### Community 6 - "Applications Data & Seeding"
Cohesion: 0.16
Nodes (17): allData, femaleApplicants, localPath, maleApplicants, now, supabase, DELETE(), GET() (+9 more)

### Community 7 - "Supabase Profile & Upload API"
Cohesion: 0.10
Nodes (15): @supabase/supabase-js@^2.118.0, @supabase/supabase-js, corsHeaders, GET(), isConfigured, normalizeProfile(), POST(), PUT() (+7 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "Vercel Deploy Config"
Cohesion: 0.29
Nodes (6): buildCommand, cleanUrls, framework, headers, installCommand, $schema

### Community 10 - "Starter SVG Assets"
Cohesion: 0.33
Nodes (6): create-next-app Starter Assets, File Document Icon, Globe Icon, Next.js Wordmark Logo, Vercel Triangle Logo, Browser Window Icon

## Ambiguous Edges - Review These
- `Crystal Question Mark` → `Orbit Mark (White)`  [AMBIGUOUS]
  public/orbit-mark-white.png · relation: conceptually_related_to

## Knowledge Gaps
- **13 isolated node(s):** `node_modules/next/dist/docs`, `Step 1: Basic Info (Name, Nickname)`, `Phone Number Auto-hyphen Formatting`, `Step 4: Region Selector (Sido / Sigungu)`, `canvas-confetti` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 121 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Events API & Admin Layout` to `Package Dependencies`, `Admin Auth & Profiles API`, `Event Management Components`, `Applications Data & Seeding`, `Supabase Profile & Upload API`, `Root Layout`?**
  _High betweenness centrality (0.309) - this node is a cross-community bridge._
- **What connects `node_modules/next/dist/docs`, `Step 1: Basic Info (Name, Nickname)`, `Phone Number Auto-hyphen Formatting` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Profile Onboarding UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06144393241167435 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Profile Onboarding UI` to `Package Dependencies`, `Events API & Admin Layout`, `Event Management Components`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06282051282051282 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `Supabase Profile & Upload API` to `Package Dependencies`, `Events API & Admin Layout`, `Admin Auth & Profiles API`, `Applications Data & Seeding`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Crystal Question Mark` and `Orbit Mark (White)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._