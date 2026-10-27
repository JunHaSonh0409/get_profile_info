# Graph Report - get_profile  (2026-10-27)

## Corpus Check
- 56 files · ~43,991 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .css 2, .example 1)

## Summary
- 305 nodes · 546 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `964fb761`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
7. `createServerSupabaseClient()` - 10 edges
8. `ProfileData` - 10 edges
9. `Multi-step Profile Onboarding Flow` - 10 edges
10. `POST()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `File Document Icon` --conceptually_related_to--> `create-next-app Starter Assets`  [INFERRED]
  public/file.svg → public/next.svg
- `Globe Icon` --conceptually_related_to--> `create-next-app Starter Assets`  [INFERRED]
  public/globe.svg → public/next.svg
- `Vercel Triangle Logo` --conceptually_related_to--> `create-next-app Starter Assets`  [INFERRED]
  public/vercel.svg → public/next.svg
- `Browser Window Icon` --conceptually_related_to--> `create-next-app Starter Assets`  [INFERRED]
  public/window.svg → public/next.svg
- `Orbit Mark (White)` --conceptually_related_to--> `Crystal Question Mark`  [AMBIGUOUS]
  public/orbit-mark-white.png → public/images/crystal_question_mark.png

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nine-step Onboarding Flow** — readme_step1_basic_info, readme_step2_gender_age, readme_step3_height_contact, readme_step4_region, readme_step5_animal_type, readme_step6_preferred_partner, readme_step7_self_intro, readme_step8_review, readme_step9_success [EXTRACTED 1.00]
- **Supabase Configuration and Deployment** — readme_supabase, readme_supabase_schema_sql, readme_supabase_env_vars, readme_env_local, readme_vercel_deployment [EXTRACTED 1.00]
- **Next.js starter icon set (file, globe, window)** — public_file_file_icon, public_globe_globe_icon, public_window_window_icon [INFERRED 0.85]

## Communities (13 total, 1 thin omitted)

### Community 0 - "Profile Onboarding UI"
Cohesion: 0.06
Nodes (45): react, INITIAL_PROFILE, MainTab, ProfilePage(), STEP_TITLES, ViewMode, ImageEditorModal(), LoginScreen() (+37 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.06
Nodes (39): eslintConfig, dependencies, canvas-confetti@^1.9.4, next@16.4.2, react@19.3.0, react-dom@19.3.0, @supabase/supabase-js@^2.118.0, devDependencies (+31 more)

### Community 2 - "Events API & Admin Layout"
Cohesion: 0.20
Nodes (18): DELETE(), GET(), POST(), PATCH(), GET(), EventPage(), EventPageContent(), generateStaticParams() (+10 more)

### Community 3 - "Admin Auth & Profiles API"
Cohesion: 0.18
Nodes (22): GET(), POST(), securityHeaders, ADMIN_COOKIE_NAME, checkRateLimit(), cleanupRateLimitStore(), createAdminSessionToken(), getAdminPassword() (+14 more)

### Community 4 - "Project Docs & Onboarding Spec"
Cohesion: 0.09
Nodes (25): generate-agent-files.js (next dev), node_modules/next/dist/docs, Next.js Agent Rules, canvas-confetti, Character Counter, .env.local, Local Dev Server (npm run dev), Multi-step Profile Onboarding Flow (+17 more)

### Community 5 - "Event Management Components"
Cohesion: 0.13
Nodes (17): EventManagementTab(), Props, EventOpenManagementTab(), Props, AdminPage(), ProfileRecord, StatsData, EventDetailClient() (+9 more)

### Community 6 - "Applications Data & Seeding"
Cohesion: 0.15
Nodes (18): allData, femaleApplicants, localPath, maleApplicants, now, supabase, DELETE(), GET() (+10 more)

### Community 7 - "Supabase Profile & Upload API"
Cohesion: 0.15
Nodes (17): AdminProfileRecord, DELETE(), GET(), normalizeAdminProfile(), securityHeaders, corsHeaders, GET(), normalizeProfile() (+9 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "Vercel Deploy Config"
Cohesion: 0.29
Nodes (6): buildCommand, cleanUrls, framework, headers, installCommand, $schema

### Community 10 - "Starter SVG Assets"
Cohesion: 0.33
Nodes (6): create-next-app Starter Assets, File Document Icon, Globe Icon, Next.js Wordmark Logo, Vercel Triangle Logo, Browser Window Icon

### Community 11 - "Root Layout"
Cohesion: 0.12
Nodes (5): nextConfig, next, metadata, metadata, viewport

## Ambiguous Edges - Review These
- `Crystal Question Mark` → `Orbit Mark (White)`  [AMBIGUOUS]
  public/orbit-mark-white.png · relation: conceptually_related_to

## Knowledge Gaps
- **13 isolated node(s):** `File Document Icon`, `Globe Icon`, `Next.js Wordmark Logo`, `Vercel Triangle Logo`, `Browser Window Icon` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 110 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Root Layout` to `Package Dependencies`, `Events API & Admin Layout`, `Admin Auth & Profiles API`, `Event Management Components`, `Applications Data & Seeding`, `Supabase Profile & Upload API`?**
  _High betweenness centrality (0.300) - this node is a cross-community bridge._
- **What connects `File Document Icon`, `Globe Icon`, `Next.js Wordmark Logo` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Profile Onboarding UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06144393241167435 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Profile Onboarding UI` to `Package Dependencies`, `Events API & Admin Layout`, `Event Management Components`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06039488966318235 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `Package Dependencies` to `Applications Data & Seeding`, `Supabase Profile & Upload API`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Crystal Question Mark` and `Orbit Mark (White)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._