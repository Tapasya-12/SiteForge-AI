# SiteForge AI

AI-assisted website generation platform with project management, iterative revisions, publishing, and multi-page editing.

This README reflects the current repository state in `e:\SiteForge-AI`.

---

## Table of Contents

1. Product Overview
2. Current Implementation Status
3. Monorepo Layout
4. Frontend Application
5. Backend Application
6. Data Model and Prisma Schema
7. Authentication and Session Flow
8. AI Generation and Revision Pipelines
9. Credits and Billing Behavior
10. Multi-Page Architecture
11. API Reference
12. Environment Variables
13. Local Development Setup
14. Build and Run Commands
15. Request and UI Flows
16. Security and Runtime Notes
17. Known Gaps and Inconsistencies
18. Troubleshooting Guide
19. Testing and Validation Notes
20. Deployment Notes
21. Roadmap Suggestions
22. File Tree Snapshot

---

## 1. Product Overview

SiteForge AI is a full-stack web application that lets signed-in users:

- create websites from prompts,
- revise generated code with follow-up prompts,
- add and revise additional pages,
- preview and publish projects,
- browse publicly published community projects,
- manage account settings and credentials.

The stack is split into:

- `client`: React + Vite + TypeScript,
- `server`: Express + TypeScript + Prisma + PostgreSQL,
- authentication: Better Auth,
- AI provider: Groq chat completions using `llama-3.3-70b-versatile`.

---

## 2. Current Implementation Status

### 2.1 Implemented

- User sign-in and session-aware protected APIs.
- Credit retrieval endpoint and frontend credit display.
- Project creation from prompt.
- Prompt enhancement before initial generation.
- Initial website HTML generation and persistence.
- Revision flow for project home page.
- Version creation for project revisions.
- Rollback to prior project versions.
- Save current project code manually.
- Delete project.
- Publish toggle for projects.
- Public list of published community projects.
- Public fetch of published project code by id.
- Multi-page APIs:
  - list pages,
  - add page,
  - delete page,
  - page revision,
  - page save,
  - page rollback.
- Frontend workspace:
  - sidebar chat and revision history panel,
  - device preview modes,
  - interactive element editor in iframe preview,
  - tab switcher for home and added pages,
  - add page modal.
- Community and My Projects pages.
- Better Auth UI-powered account settings, change password, and delete account cards.

### 2.2 Partially Implemented or Placeholder

- Credit purchase endpoint currently returns placeholder message.
- Pricing page purchase button calls placeholder endpoint.
- Payment controllers/routes are not present in current server source routes.
- Stripe config file is not present in current source configs folder, while `dist` contains older compiled artifacts.

### 2.3 Notable Repository Reality Checks

These files are referenced in some historical conversations but are not present in current source tree:

- `server/lib/colorPalette.ts`
- `server/controllers/paymentController.ts`
- `server/routes/paymentRoutes.ts`

---

## Deployment

- Frontend: Deployed on Vercel at https://site-forge-ai.vercel.app
- Backend: Deployed on Render at https://siteforge-backend-nwvu.onrender.com
- Database: Neon PostgreSQL (hosted, serverless)

---

## 3. Monorepo Layout

Root contains two major apps:

- `client`: browser SPA
- `server`: API and AI orchestration layer

There are also generated Prisma client artifacts under `server/generated/prisma` and compiled artifacts under `server/dist`.

---

## 4. Frontend Application

### 4.1 Frontend Stack

- React 19
- React Router
- TypeScript
- Vite
- Axios
- Sonner for notifications
- Lucide React icons
- Better Auth UI package

### 4.2 Frontend Entry

- `client/src/main.tsx`:
  - wraps app with `BrowserRouter`,
  - wraps app with `Providers`.

- `client/src/providers.tsx`:
  - wires `AuthUIProvider` with `authClient`,
  - injects navigation via `react-router` navigate,
  - maps `Link` through `NavLink`.

### 4.3 Routes

Configured in `client/src/App.tsx`:

- `/`
- `/pricing`
- `/projects`
- `/projects/:projectId`
- `/preview/:projectId`
- `/preview/:projectId/:versionId`
- `/community`
- `/view/:projectId`
- `/auth/:pathname`
- `/account/settings`

Navbar visibility is disabled on project editor routes, preview routes, and public view routes.

### 4.4 Core Pages

#### Home

- file: `client/src/pages/Home.tsx`
- responsibilities:
  - prompt input,
  - style preset selection,
  - session check before project creation,
  - `POST /api/user/project`,
  - redirect to `/projects/:projectId` on success.

Style presets currently available in UI:

- Dark and Luxe
- Bold Agency
- Clean SaaS
- Minimalist
- Neon Future
- Warm and Earthy

#### My Projects

- file: `client/src/pages/MyProjects.tsx`
- responsibilities:
  - `GET /api/user/projects`,
  - display project cards with iframe previews,
  - delete project via `DELETE /api/project/:projectId`,
  - navigate to editor or preview.

#### Projects Workspace

- file: `client/src/pages/Projects.tsx`
- responsibilities:
  - fetch project detail via `GET /api/user/project/:projectId`,
  - toolbar actions:
    - save,
    - preview,
    - download current active page code,
    - publish/unpublish toggle,
  - sidebar messaging and revisions,
  - page tabs and add/delete page interactions,
  - live project/page state updates from preview editor.

#### Preview

- file: `client/src/pages/Preview.tsx`
- responsibilities:
  - `GET /api/project/preview/:projectId`,
  - render code using `ProjectPreview` with editor hidden.

#### Public View

- file: `client/src/pages/View.tsx`
- responsibilities:
  - `GET /api/project/published/:projectId`,
  - render public code using `ProjectPreview` with editor hidden.

#### Community

- file: `client/src/pages/Community.tsx`
- responsibilities:
  - `GET /api/project/published`,
  - display published cards and author initials/name,
  - open public view route in new tab.

#### Pricing

- file: `client/src/pages/Pricing.tsx`
- uses `appPlans` from `client/src/assets/assets.ts`,
- calls `POST /api/user/purchase-credits`,
- dispatches `credits-updated` event on successful response.

#### Settings

- file: `client/src/pages/Settings.tsx`
- renders Better Auth UI account cards:
  - `AccountSettingsCards`,
  - `ChangePasswordCard`,
  - `DeleteAccountCard`.

#### AuthPage

- file: `client/src/pages/auth/AuthPage.tsx`
- uses `AuthView` from Better Auth UI with pathname from route params.

### 4.5 Key UI Components

#### Navbar

- file: `client/src/components/Navbar.tsx`
- features:
  - top navigation links,
  - responsive mobile menu,
  - session-aware sign-in button or user controls,
  - credits badge from `GET /api/user/credits`,
  - listens to `credits-updated` window event.

#### SiteForgeLogo

- file: `client/src/components/SiteForgeLogo.tsx`
- gradient SVG mark and wordmark.

#### Sidebar

- file: `client/src/components/Sidebar.tsx`
- merges conversation and versions by timestamp,
- supports sending revision prompt,
- supports rollback action per version,
- route selection depends on `activePage` presence.

#### ProjectPreview

- file: `client/src/components/ProjectPreview.tsx`
- uses iframe `srcDoc` rendering,
- injects `iframeScript` from `assets.ts` when editor enabled,
- listens for element selection messages,
- exposes `getCode` via ref,
- supports device width presets,
- sends live updates back to iframe.

#### EditorPanel

- file: `client/src/components/EditorPanel.tsx`
- edits selected element text, className, padding, margin, colors, font size,
- can apply changes to parent state and close selection.

#### PageSwitcher

- file: `client/src/components/PageSwitcher.tsx`
- always includes Home tab,
- lists additional pages with delete button,
- add page trigger button.

#### AddPageModal

- file: `client/src/components/AddPageModal.tsx`
- quick-select preset page names,
- auto slug generation,
- submits to add page handler.

### 4.6 Frontend API Client

- file: `client/src/configs/axios.ts`
- `baseURL`: `VITE_BASEURL` or `http://localhost:3000`
- `withCredentials: true`.

### 4.7 Frontend Auth Client

- file: `client/src/lib/auth-client.ts`
- `createAuthClient` with `baseURL` from `VITE_BASEURL`,
- fetch credentials include,
- exports `signIn`, `signUp`, `useSession`.

---

## 5. Backend Application

### 5.1 Backend Stack

- Express 5
- TypeScript with tsx runtime
- Prisma ORM with PostgreSQL adapter
- Better Auth
- Groq SDK

### 5.2 Server Bootstrap

- file: `server/server.ts`
- responsibilities:
  - configure CORS from `TRUSTED_ORIGINS`,
  - mount Better Auth node handler at `/api/auth/{*any}`,
  - parse JSON with 50mb limit,
  - mount `/api/user` and `/api/project` routers,
  - simple root health route.

### 5.3 Middleware

- file: `server/middlewares/auth.ts`
- `protect` middleware:
  - reads session via `auth.api.getSession` and `fromNodeHeaders`,
  - sets `req.userId`,
  - rejects unauthenticated calls with 401.

### 5.4 Controllers Overview

#### userController

- file: `server/controllers/userController.ts`
- endpoints implemented:
  - `getUserCredits`,
  - `purchaseCredits` placeholder,
  - `getUserProject`,
  - `getUserProjects`,
  - `togglePublish`,
  - `createUserProject`.

`createUserProject` performs:

- style directive extraction from prompt prefix,
- user auth validation,
- credit check,
- project creation,
- user `totalCreation` increment,
- conversation entries for user and assistant,
- credit decrement,
- AI prompt enhancement,
- AI initial HTML generation,
- version creation,
- `current_code` and `current_version_index` update.

#### projectController

- file: `server/controllers/projectController.ts`
- endpoints implemented:
  - `makeRevision`,
  - `rollbackToVersion`,
  - `deleteProject`,
  - `getProjectPreview`,
  - `getPublishedProjects`,
  - `getProjectById`,
  - `saveProjectCode`.

`makeRevision` performs:

- user auth validation,
- credit check,
- prompt validation,
- conversation write,
- credit decrement,
- prompt enhancement,
- revised code generation,
- new version creation,
- project `current_code` replacement,
- assistant conversation update.

#### pageController

- file: `server/controllers/pageController.ts`
- helper: `sanitizeGeneratedPage` for image src fixes and style injection fallback.
- endpoints implemented:
  - `addPage`,
  - `getPages`,
  - `deletePage`,
  - `makePageRevision`,
  - `savePageCode`,
  - `rollbackPageVersion`.

`addPage` performs:

- user auth and credit check,
- project existence check,
- page name and slug validation,
- credit decrement,
- AI page generation prompt with strong style inheritance rules,
- code cleanup,
- `sanitizeGeneratedPage`,
- page create,
- `pageVersion` create,
- `current_version_index` update.

### 5.5 AI Helper

- file: `server/lib/aiHelper.ts`
- wrapper function `chatWithFallback` currently does a single Groq call.
- model:
  - `llama-3.3-70b-versatile`
- settings:
  - `max_tokens: 8000`
  - `temperature: 0.3`

### 5.6 Auth Configuration

- file: `server/lib/auth.ts`
- Better Auth configured with:
  - Prisma adapter,
  - `emailAndPassword` enabled,
  - `deleteUser` enabled,
  - `trustedOrigins`,
  - `baseUrl` and `secret` from env,
  - custom session token cookie name `auth_session`,
  - cookie attributes vary by `NODE_ENV`.

### 5.7 Prisma Client Wiring

- file: `server/lib/prisma.ts`
- uses `PrismaPg` adapter and generated client from `server/generated/prisma`.

---

## 6. Data Model and Prisma Schema

Primary schema file:

- `server/prisma/schema.prisma`

### 6.1 Core Domain Models

#### User

- `id`
- `email`
- `name`
- `totalCreation` default 0
- `credits` default 20
- `emailVerified`
- `createdAt` and `updatedAt`

Relations:

- `projects`
- `sessions`
- `accounts`
- `transactions`

#### WebsiteProject

- `id` uuid
- `name`
- `initial_prompt`
- `current_code` nullable
- `current_version_index`
- `userId`
- `isPublished` default false
- `createdAt` and `updatedAt`

Relations:

- `conversation`
- `versions`
- `pages`
- `user`

#### Conversation

- `id` uuid
- `role` enum user or assistant
- `content`
- `timestamp`
- `projectId`

#### Version

- `id` uuid
- `code`
- `description` nullable
- `timestamp`
- `projectId`

#### Page

- `id` uuid
- `name`
- `slug`
- `current_code` nullable
- `current_version_index`
- `projectId`
- `order` default 0
- `createdAt` and `updatedAt`

Relations:

- `versions`
- `project`

#### PageVersion

- `id` uuid
- `code`
- `description` nullable
- `timestamp`
- `pageId`

#### Transaction

- `id` uuid
- `isPaid` default false
- `planId`
- `amount`
- `credits`
- `userId`
- `createdAt` and `updatedAt`

### 6.2 Auth-Related Models

- `Session`
- `Account`
- `Verification`

Mapped table names:

- `user`
- `session`
- `account`
- `verification`

### 6.3 Important Defaults

- User credits default 20.
- Project `isPublished` default false.
- Page `order` default 0.

---

## 7. Authentication and Session Flow

### 7.1 Client-Side

- `authClient` from `better-auth/react` is used.
- `AuthUIProvider` wraps app through `Providers`.
- Navbar checks session to determine sign-in button or user controls.

### 7.2 Server-Side

- Better Auth routes mounted at `/api/auth/{*any}`.
- protected API routes rely on middleware `protect`.

### 7.3 Session Cookie

- cookie name: `auth_session`
- `httpOnly: true`
- `secure`:
  - true in production,
  - false in development
- `sameSite`:
  - `none` in production,
  - `lax` in development

### 7.4 Protected vs Public Endpoints

Protected:

- most `/api/user` routes
- most `/api/project` routes except published fetch routes

Public:

- `GET /api/project/published`
- `GET /api/project/published/:projectId`

---

## 8. AI Generation and Revision Pipelines

### 8.1 Initial Project Creation Pipeline

1. Validate user and prompt.
2. Optionally parse style preset tag from prompt.
3. Check user credits.
4. Persist project shell and initial conversation.
5. Decrement credits.
6. Call AI for prompt enhancement.
7. Store enhancement conversation.
8. Call AI for HTML generation.
9. Clean markdown fences from response.
10. Create initial version row.
11. Save `current_code` and `current_version_index`.

### 8.2 Project Revision Pipeline

1. Validate user, credits, and message.
2. Persist user message.
3. Decrement credits.
4. Enhance revision prompt.
5. Generate updated full HTML against current code.
6. Clean response fences.
7. Create version row.
8. Update project `current_code` and `current_version_index`.

### 8.3 Add Page Pipeline

1. Validate user, credits, project, and page input.
2. Decrement credits.
3. Generate full page HTML while inheriting home style.
4. Sanitize output:
   - patch image src issues,
   - inject style block from home code if missing.
5. Create page and initial `pageVersion`.
6. Set page `current_version_index`.

### 8.4 Page Revision Pipeline

1. Validate user, credits, project, page, and message.
2. Decrement credits.
3. Prompt enhancement.
4. Full-page regeneration using current page code and home context.
5. `sanitizeGeneratedPage`.
6. Create `pageVersion`.
7. Update page `current_code` and `current_version_index`.

---

## 9. Credits and Billing Behavior

### 9.1 Backend-Enforced Costs

Based on controller logic in current source:

- create project: 5 credits
- project revision: 5 credits
- add page: 10 credits
- page revision: 5 credits

### 9.2 Frontend Messaging

Current frontend text contains mixed cost messaging:

- AddPageModal states add page costs 10 credits.
- Pricing footer text states project creation consumes 10 credits and revision 5.

This is inconsistent with current backend create project behavior of 5 credits.

### 9.3 Purchase Flow

- `POST /api/user/purchase-credits` currently returns:
  - `Purchase credits coming soon`
- No payment processing path is active in source route wiring.

---

## 10. Multi-Page Architecture

### 10.1 Storage Model

- Home page code is `websiteProject.current_code`.
- Additional pages are records in `Page`.
- Each page has page-level versions in `PageVersion`.

### 10.2 Frontend Active Page Semantics

- `activePage = null` means Home tab.
- `activePage != null` means an additional page.

### 10.3 Save and Revision Routing Logic

When `activePage` is set:

- save uses `/api/project/:projectId/pages/:pageId/save`
- revision uses `/api/project/:projectId/pages/:pageId/revision`
- rollback uses `/api/project/:projectId/pages/:pageId/rollback/:versionId`

When `activePage` is null:

- save uses `/api/project/save/:projectId`
- revision uses `/api/project/revision/:projectId`
- rollback uses `/api/project/rollback/:projectId/:versionId`

### 10.4 Page Tab UX

- Home tab first.
- Added pages displayed with delete button.
- Plus icon opens modal with quick page presets.

---

## 11. API Reference

Base URL in development:

- `http://localhost:3000`

### 11.1 User Routes

Mounted under `/api/user`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/user/credits | required | get current user credits |
| POST | /api/user/project | required | create project from initial prompt |
| GET | /api/user/project/:projectId | required | get full project with conversation, versions, pages |
| GET | /api/user/projects | required | list user projects |
| GET | /api/user/publish-toggle/:projectId | required | toggle publish status |
| POST | /api/user/purchase-credits | required | placeholder purchase endpoint |

### 11.2 Project Routes

Mounted under `/api/project`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/project/:projectId/pages | required | list pages for project |
| POST | /api/project/:projectId/pages | required | add page |
| DELETE | /api/project/:projectId/pages/:pageId | required | delete page |
| POST | /api/project/:projectId/pages/:pageId/revision | required | revise page code |
| PUT | /api/project/:projectId/pages/:pageId/save | required | save page code |
| GET | /api/project/:projectId/pages/:pageId/rollback/:versionId | required | rollback page to prior version |
| POST | /api/project/revision/:projectId | required | revise project home code |
| PUT | /api/project/save/:projectId | required | save project home code |
| GET | /api/project/rollback/:projectId/:versionId | required | rollback project home version |
| DELETE | /api/project/:projectId | required | delete project |
| GET | /api/project/preview/:projectId | required | get project preview payload |
| GET | /api/project/published | public | list published projects |
| GET | /api/project/published/:projectId | public | get published code by project id |

### 11.3 Auth Route

| Method | Path | Auth | Description |
|---|---|---|---|
| ALL | /api/auth/{*any} | depends | Better Auth handler passthrough |

### 11.4 Example Calls

Create a project:

```bash
curl -X POST http://localhost:3000/api/user/project \
  -H "Content-Type: application/json" \
  -d '{"initial_prompt":"Create a startup landing page for a cloud backup app"}' \
  --cookie "auth_session=..."
```

Create page:

```bash
curl -X POST http://localhost:3000/api/project/<projectId>/pages \
  -H "Content-Type: application/json" \
  -d '{"name":"About","slug":"about"}' \
  --cookie "auth_session=..."
```

Rollback page version:

```bash
curl -X GET "http://localhost:3000/api/project/<projectId>/pages/<pageId>/rollback/<versionId>" \
  --cookie "auth_session=..."
```

---

## 12. Environment Variables

### 12.1 Required Server Variables

Production server env vars:

- `DATABASE_URL`: Neon PostgreSQL connection string
- `TRUSTED_ORIGINS`: Vercel frontend URL
- `BETTER_AUTH_URL`: Render backend URL
- `BETTER_AUTH_SECRET`: secret key
- `GROQ_API_KEY`: Groq API key
- `NODE_ENV`: production
- `STRIPE_SECRET_KEY`: Stripe secret
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `CLIENT_URL`: Vercel frontend URL

Suggested `server/.env`:

```env
DATABASE_URL=<neon_postgresql_connection_string>
TRUSTED_ORIGINS=https://site-forge-ai.vercel.app
BETTER_AUTH_URL=https://siteforge-backend-nwvu.onrender.com
BETTER_AUTH_SECRET=<your_secret_key>
GROQ_API_KEY=<your_groq_api_key>
NODE_ENV=production
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<your_stripe_webhook_secret>
CLIENT_URL=https://site-forge-ai.vercel.app
```

### 12.2 Required Client Variables

Production client env vars:

- `VITE_BASEURL`: Render backend URL
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

Suggested `client/.env`:

```env
VITE_BASEURL=https://siteforge-backend-nwvu.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
```

---

## 13. Local Development Setup

### 13.1 Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL running locally or remotely

### 13.2 Install

From repository root:

```bash
cd client
npm install

cd ../server
npm install
```

### 13.3 Prisma

From server:

```bash
npx prisma generate
npx prisma migrate dev
```

### 13.4 Start Applications

Terminal 1:

```bash
cd server
npm run start
```

or with watcher:

```bash
cd server
npm run server
```

Terminal 2:

```bash
cd client
npm run dev
```

### 13.5 Access

- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`

### 13.6 Local Env Overrides

For local development, use:

- `VITE_BASEURL=http://localhost:3000`
- `TRUSTED_ORIGINS=http://localhost:5173`

---

## 14. Build and Run Commands

### 14.1 Client scripts

Defined in `client/package.json`:

- `dev`: `vite`
- `build`: `tsc -b && vite build`
- `lint`: `eslint .`
- `preview`: `vite preview`

### 14.2 Server scripts

Defined in `server/package.json`:

- `start`: `tsx server.ts`
- `server`: `nodemon --exec tsx server.ts`
- `build`: `tsc`

---

## 15. Request and UI Flows

### 15.1 Create Website Flow

1. User enters prompt and optional style in Home.
2. Client submits `POST /api/user/project`.
3. Server checks auth and credits.
4. Server enhances prompt and generates full HTML.
5. Server stores project, conversation, and initial version.
6. Client navigates to project workspace.

### 15.2 Revision Flow

1. User enters revision prompt in sidebar.
2. Client calls revision endpoint for active target.
3. Server enhances request and regenerates full code.
4. Server stores new version and updates current code.
5. Client refetches project and re-renders preview.

### 15.3 Publish Flow

1. User clicks publish or unpublish in workspace header.
2. Client calls `GET /api/user/publish-toggle/:projectId`.
3. Server flips `isPublished`.
4. Client updates local project publish state.

### 15.4 Add Page Flow

1. User opens AddPageModal.
2. User picks quick preset or enters custom name and slug.
3. Client submits `POST /api/project/:projectId/pages`.
4. Server generates page using home style context.
5. Server saves page and initial page version.
6. Client sets `activePage` to new page id.

### 15.5 Public View Flow

1. Community lists published projects from public endpoint.
2. User opens `/view/:projectId`.
3. View page fetches public code and renders in iframe preview.

---

## 16. Security and Runtime Notes

### 16.1 CORS

- Controlled by `TRUSTED_ORIGINS` split by comma.
- `credentials: true` in CORS config.

### 16.2 Cookie Security

- session cookie `secure` and `sameSite` values depend on `NODE_ENV`.

### 16.3 Protected APIs

- `protect` middleware enforces session retrieval per request.

### 16.4 iframe Editing Model

- editor mode injects script into preview HTML.
- script captures click selections and sends payload via `postMessage`.
- parent panel sends `UPDATE_ELEMENT` messages back to iframe.

### 16.5 Input and Payload Size

- server JSON parser limit is `50mb`.

---

## 17. Known Gaps and Inconsistencies

1. Pricing copy mismatch:
   - frontend copy states project creation costs 10 credits,
   - backend currently decrements 5 for `createUserProject`.

2. Purchase endpoint is placeholder:
   - no real transaction completion path in active source routes.

3. `dist` folder contains compiled artifacts that may not reflect latest source edits.

4. Prompt enhancement and generation instructions include overlapping rules and can be simplified.

5. Route naming consistency:
   - auth route in app uses `/auth/:pathname`,
   - navbar currently navigates to `/auth/signin`,
   - ensure Better Auth UI expected pathname values are aligned.

6. CORS dynamic preview support:
  - CORS config now uses a function that dynamically allows Vercel preview deployment URLs matching `https://site-forge-*.vercel.app`.

---

## 18. Troubleshooting Guide

### 18.1 401 Unauthorized on protected endpoints

Check:

- browser has `auth_session` cookie,
- client uses `withCredentials: true`,
- `VITE_BASEURL` points to backend,
- `TRUSTED_ORIGINS` includes frontend origin.

### 18.2 AI generation fails

Check:

- `GROQ_API_KEY` present and valid,
- server logs for Groq errors,
- outbound network access to Groq API.

### 18.3 No projects load in My Projects

Check:

- session is active,
- `GET /api/user/projects` returns data,
- axios baseURL is correct.

### 18.4 Preview not rendering

Check:

- `current_code` exists in project or page,
- generated HTML is complete and valid,
- iframe sandbox behavior if scripts are required in rendered code.

### 18.5 Prisma errors

Check:

- `DATABASE_URL` correctness,
- `prisma generate` run after dependency install,
- migrations applied.

---

## 19. Testing and Validation Notes

### 19.1 Existing Test Files in Server Root

The repository contains temporary test scripts, including:

- `test-stripe.js`
- `tmp_check_credits.ts`
- `tmp_check_low_credit.ts`
- `tmp_test.ts`
- `tmp_test1_fallback.ts`
- `tmp_zip_test.ts`

These are not wired into an npm test script in current `package.json` files.

### 19.2 Suggested Validation Checklist

Manual checks:

- sign in and sign out,
- create project with and without style preset,
- verify credits decrement behavior,
- create revision and rollback,
- add page and page revision,
- save page and save home,
- toggle publish and verify in community view,
- open public view from community list,
- account settings cards render and actions work.

---

## 20. Deployment Notes

### 20.1 Frontend Deployment

- Platform: Vercel
- Root directory: `client`
- Framework preset: Vite
- Production URL: `https://site-forge-ai.vercel.app`

### 20.2 Backend Deployment

- Platform: Render
- Production URL: `https://siteforge-backend-nwvu.onrender.com`
- Build command includes:
  - `npm install --include=dev`
  - `npx prisma generate`
  - `npx prisma migrate deploy`
  - `npm run build` (tsc)
  - `cp -r generated dist/generated`

### 20.3 Database and Runtime

- Database: Neon PostgreSQL (hosted, serverless)
- No self-hosting required for database
- Render must have `NODE_ENV=production` for secure cookie behavior

---

## 21. Roadmap Suggestions

This section is implementation-driven and aligns with current gaps.

1. Complete purchase pipeline:
   - add real payment route/controller,
   - persist transaction success and credit updates,
   - connect pricing plans to backend validation.

2. Align credit copy and backend rules:
   - decide canonical costs,
   - update frontend explanatory text and API docs.

3. Add automated tests:
   - controller unit tests,
   - route integration tests,
   - key frontend flow smoke tests.

4. Introduce stricter validation:
   - request schema validation for routes,
   - sanitize and normalize generated HTML more robustly.

5. Add observability:
   - structured logs,
   - request ids,
   - metrics for generation latency and failures.

6. Improve preview safety hardening:
   - stricter CSP/sandbox handling,
   - optional sanitization for dangerous inline scripts.

---

## 22. File Tree Snapshot

Snapshot based on current workspace structure and key subdirectories.

```text
README.md
client/
  components.json
  eslint.config.js
  index.html
  package.json
  README.md
  tsconfig.app.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
  public/
  src/
    App.tsx
    index.css
    main.tsx
    providers.tsx
    assets/
      assets.ts
      schema.prisma
    components/
      AddPageModal.tsx
      EditorPanel.tsx
      Footer.tsx
      LoaderSteps.tsx
      Navbar.tsx
      PageSwitcher.tsx
      ProjectPreview.tsx
      Sidebar.tsx
      SiteForgeLogo.tsx
    configs/
      axios.ts
    lib/
      auth-client.ts
      utils.ts
    pages/
      Community.tsx
      Home.tsx
      MyProjects.tsx
      PaymentSuccess.tsx
      Preview.tsx
      Pricing.tsx
      Projects.tsx
      Settings.tsx
      View.tsx
      auth/
        AuthPage.tsx
    types/
      index.ts
server/
  package.json
  prisma.config.ts
  Procfile
  server.ts
  test-stripe.js
  tmp_check_credits.ts
  tmp_check_low_credit.ts
  tmp_test.ts
  tmp_test1_fallback.ts
  tmp_zip_test.ts
  tsconfig.json
  configs/
    groq.ts
  controllers/
    pageController.ts
    projectController.ts
    userController.ts
  generated/
    prisma/
      browser.ts
      client.d.ts
      client.js
      client.ts
      commonInputTypes.ts
      default.d.ts
      default.js
      edge.d.ts
      edge.js
      enums.ts
      index-browser.js
      index.d.ts
      index.js
      models.ts
      package.json
      query_engine_bg.js
      query_engine-windows.dll.node
      schema.prisma
      wasm-edge-light-loader.mjs
      wasm-worker-loader.mjs
      wasm.d.ts
      wasm.js
      internal/
        class.ts
        prismaNamespace.ts
        prismaNamespaceBrowser.ts
      models/
        Account.ts
        Conversation.ts
        Page.ts
        PageVersion.ts
        Payment.ts
        Session.ts
        ...
      runtime/
  lib/
    aiHelper.ts
    auth.ts
    prisma.ts
  middlewares/
    auth.ts
  prisma/
    schema.prisma
    migrations/
      migration_lock.toml
      20260122130626_init/
      20260325203014_add_payment_model/
      20260325203128_add_payment_model/
      20260403112058_update_default_credits/
  routes/
    projectRoutes.ts
    userRoutes.ts
  types/
    express.d.ts
```

---

## Appendix A: Frontend Dependency List

From `client/package.json` dependencies:

- `@daveyplate/better-auth-ui`
- `@tailwindcss/vite`
- `axios`
- `better-auth`
- `class-variance-authority`
- `clsx`
- `lucide-react`
- `react`
- `react-dom`
- `react-router-dom`
- `sonner`
- `tailwind-merge`
- `tailwindcss`

Dev dependencies:

- `@eslint/js`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `tw-animate-css`
- `typescript`
- `typescript-eslint`
- `vite`

## Appendix B: Backend Dependency List

From `server/package.json` dependencies:

- `@google/generative-ai`
- `@prisma/adapter-pg`
- `@prisma/client`
- `better-auth`
- `cors`
- `dotenv`
- `express`
- `groq-sdk`
- `openai`
- `pg`

Dev dependencies:

- `@types/cors`
- `@types/express`
- `@types/node`
- `@types/pg`
- `nodemon`
- `prisma`
- `ts-node`
- `tsx`
- `typescript`

## Appendix C: Source of Truth Notes

This README is based on direct inspection of current repository source files in `client/src` and `server`.

When there is mismatch between UI text and backend logic, backend controller logic is treated as runtime source of truth.
