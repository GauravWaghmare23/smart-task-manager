# Smart Task Manager — Frontend Documentation

This document describes the **frontend implementation only**, as it exists in `client/src`. It is derived directly from the source code — no planned or aspirational functionality is included. Where a feature might be assumed but isn't present (e.g. a sidebar on the user dashboard, protected route middleware, refresh tokens), that is called out explicitly.

---

## Table of Contents

1. [Frontend Overview](#1-frontend-overview)
2. [Next.js App Router Structure](#2-nextjs-app-router-structure)
3. [Authentication Flow](#3-authentication-flow)
4. [AuthProvider](#4-authprovider)
5. [AuthGuard](#5-authguard)
6. [Redux Authentication State](#6-redux-authentication-state)
7. [Axios API Layer](#7-axios-api-layer)
8. [Task API Integration](#8-task-api-integration)
9. [User API Integration](#9-user-api-integration)
10. [Form Handling with React Hook Form](#10-form-handling-with-react-hook-form)
11. [Zod Validation](#11-zod-validation)
12. [Admin Dashboard](#12-admin-dashboard)
13. [User Dashboard / My Tasks](#13-user-dashboard--my-tasks)
14. [Task Creation](#14-task-creation)
15. [Task Details Dialog](#15-task-details-dialog)
16. [User Management](#16-user-management)
17. [Task Filtering and Search](#17-task-filtering-and-search)
18. [Dependency UX](#18-dependency-ux)
19. [Loading / Error / Empty States](#19-loading--error--empty-states)
20. [Toast Notifications](#20-toast-notifications)
21. [Responsive Design](#21-responsive-design)
22. [Component Reusability](#22-component-reusability)
23. [Environment Variables](#23-environment-variables)
24. [Local Development](#24-local-development)

---

## 1. Frontend Overview

The frontend is a Next.js application (`client/`) using JavaScript (no TypeScript — `tsx: false` in `components.json`) and the **App Router** (`src/app`). It is a client-heavy SPA-style app: almost every page is marked `"use client"` and fetches data from a separate Express API via Axios rather than using Server Components or Route Handlers for data access.

Notably, `next.config.mjs` sets:

```js
const nextConfig = {
  output: "export",
};
```

This configures a **static export** build. This decision explains several other choices in the codebase:
- There are no Next.js Route Handlers (`route.js`) or Server Actions — a statically exported app can't run server code at request time, so all business logic lives in the separate Express backend (`server/`) and is called from the client via Axios.
- Route protection is done at runtime in the browser (`AuthGuard`), not via Next.js middleware — static export has no middleware execution.
- Session state (JWT) is kept in `localStorage` and rehydrated on the client, since there's no server to own a session.

Core libraries and their role:

| Library | Role |
|---|---|
| Next.js 16 (App Router) | Routing, layouts, static export |
| React 19 | UI rendering |
| Redux Toolkit + React Redux | Global auth state |
| Axios | HTTP client with a shared instance and auth interceptor |
| React Hook Form + Zod | Form state and schema validation |
| Tailwind CSS v4 + shadcn/ui | Styling and UI primitives |
| Lucide React | Icons |
| Sonner | Toast notifications |

---

## 2. Next.js App Router Structure

```
src/app/
├── layout.js              # Root layout: fonts, StoreProvider, AuthProvider, AuthGuard, Toaster
├── page.js                # Default create-next-app landing page (unmodified boilerplate)
├── login/
│   └── page.js             # Login form
└── dashboard/
    ├── admin/
    │   ├── layout.js        # Wraps admin pages with SidebarProvider + AppSidebar
    │   ├── page.js           # Admin overview (stats)
    │   ├── tasks/page.js     # Admin task list, create/view tasks
    │   └── users/page.js     # Admin user list, create/delete users
    └── user/
        └── page.js           # "My Tasks" view for a regular user
```

**Why this shape:**
- Route groups mirror the two roles (`ADMIN`, `USER`) that the backend recognizes, so authorization and layout concerns can be scoped per-branch rather than checked ad hoc on every page.
- `dashboard/admin/layout.js` is the only nested layout in the app — it injects the sidebar chrome (`AppSidebar` + `SidebarProvider`) purely for admin routes. There is **no equivalent `layout.js` under `dashboard/user/`**, so the user dashboard renders without a sidebar or any shared chrome — it's a standalone page.
- `src/app/page.js` (the `/` route) is still the default `create-next-app` template. It is not part of the task manager's real UI; redirection into the app happens through `AuthGuard`/`login`, not through `/`.
- Path aliasing (`@/*` → `./src/*`, from `jsconfig.json`) keeps imports flat regardless of nesting depth (e.g. `@/services/api/task.api`).

---

## 3. Authentication Flow

Authentication is JWT-based and entirely client-driven:

1. User submits credentials on `/login`.
2. `loginUser()` calls `POST /auth/login`; the response contains `{ user, token }`.
3. The token is written to `localStorage` and both `user`/`token` are pushed into Redux via `setCredentials`.
4. The user is redirected with `router.push()` based on `response.user.role` (`ADMIN` → `/dashboard/admin`, otherwise → `/dashboard/user`).
5. On every subsequent app load, `AuthProvider` reads the token from `localStorage` and calls `GET /auth/me` to rehydrate the Redux user, since Redux state itself doesn't persist across a full page reload.
6. `AuthGuard` reacts to the resulting auth state and redirects unauthenticated users to `/login`, or authenticated users away from `/login`.
7. Logout (`AppSidebar`) clears `localStorage` and dispatches `logout()`, then does a hard `router.replace("/login")`.

This flow relies on `localStorage` as the single source of truth for the token, with Redux acting purely as an in-memory, reactive mirror of it for the current tab session.

---

## 4. AuthProvider

`src/components/auth/AuthProvider.jsx` is a client component mounted once, at the root layout, above everything else:

```jsx
useEffect(() => {
  const restoreSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(setAuthLoading(false));
      return;
    }
    try {
      const data = await getCurrentUser();
      dispatch(setCredentials({ user: data.data, token }));
    } catch (error) {
      localStorage.removeItem("token");
      dispatch(logout());
    }
  };
  restoreSession();
}, [dispatch]);
```

**Why it exists:** Redux state is created fresh on every page load/refresh, but the JWT in `localStorage` survives. `AuthProvider`'s only job is to bridge that gap once, on mount — verify the stored token is still valid by calling `/auth/me`, and either populate Redux with the real user or clear the stale token. It renders `children` unconditionally and does not block rendering itself; `AuthGuard` (next section) is what actually gates the UI while this check is in flight, via the shared `loading` flag.

---

## 5. AuthGuard

`src/components/auth/AuthGuard.jsx` wraps the entire app (inside `AuthProvider`, in the root layout) and is the sole route-protection mechanism:

```jsx
const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

useEffect(() => {
  if (loading) return;

  const isLoginPage = pathname === "/login";

  if (!isAuthenticated && !isLoginPage) {
    router.replace("/login");
    return;
  }

  if (isAuthenticated && isLoginPage) {
    router.replace(user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/user");
  }
}, [loading, isAuthenticated, user, pathname, router]);

if (loading) {
  return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
}

return children;
```

**Why a client-side guard instead of middleware:** because the app is statically exported (`output: "export"`), Next.js middleware and server-side redirects aren't available at runtime. Guarding has to happen after hydration, using the Redux auth state that `AuthProvider` populates. While `loading` is `true`, the guard renders a plain loading message instead of children, which prevents a flash of protected content (or an unwanted redirect) before the token-verification request in `AuthProvider` has resolved.

**Scope of protection:** `AuthGuard` only distinguishes "authenticated vs. not" and "which dashboard root to send a role to" — it does not enforce that a `USER` role staying out of `/dashboard/admin/*` routes; there is no role-based route check beyond the initial post-login/rehydration redirect. Route-level authorization for admin-only pages is not implemented on the frontend.

---

## 6. Redux Authentication State

`src/store/store.js` configures a single-slice store:

```js
export const store = configureStore({
  reducer: { auth: authReducer },
});
```

`src/store/slices/authSlice.js` (Redux Toolkit `createSlice`) holds:

```js
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,   // starts true until AuthProvider resolves
};
```

Actions: `setCredentials` (login success / session restore), `setUser` (sets user without touching token, unused outside the slice itself in current code paths beyond export), `setAuthLoading`, and `logout`.

**Why Redux Toolkit for just one slice:** Auth state is read from multiple, otherwise-unrelated places — `AuthGuard`, `AppSidebar` (to display the current user and log out), and every page that needs to know the current role — so a single global store avoids prop-drilling the user object through layouts. `configureStore`'s built-in Immer support is why reducers can mutate `state` directly (e.g. `state.user = user`) instead of returning new objects. `src/store/provider.js` wraps the app in `<Provider store={store}>` inside the root layout so all client components can `useSelector`/`useDispatch`.

---

## 7. Axios API Layer

`src/services/api/api.js` centralizes HTTP configuration:

```js
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof Window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
```

**Why a single Axios instance:** every authenticated request needs the same `Authorization: Bearer <token>` header, and centralizing that in a request interceptor means individual API functions (`task.api.js`, `auth.api.js`) never handle auth headers themselves — they just call `api.get/post/patch/delete`. This keeps each API module focused purely on endpoint shape.

Note: the interceptor's guard checks `typeof Window !== "undefined"` (capital `W`). Since `Window` (the constructor) is not `undefined` in a browser, this check always passes there; it does not actually detect a non-browser environment the way `typeof window` would. In this app's current all-client-component usage, requests are only ever issued from the browser, so it hasn't surfaced as a functional bug, but it should not be read as a working SSR guard.

`baseURL` is read from `NEXT_PUBLIC_API_URL` — see [Environment Variables](#23-environment-variables).

---

## 8. Task API Integration

`src/services/api/task.api.js` wraps the task endpoints 1:1:

```js
createTask(taskData)            // POST /tasks
getMyTasks(filters = {})        // GET  /tasks/mine   (params: filters)
getAllTasks(filters = {})       // GET  /tasks        (params: filters)
getTaskById(taskId)             // GET  /tasks/:id
updateTaskStatus(taskId, status)// PATCH /tasks/:id/status  { status }
deleteTask(taskId)              // DELETE /tasks/:id
```

Every function returns `response.data` directly — callers don't touch the raw Axios response. `getMyTasks`/`getAllTasks` forward a `filters` object straight to Axios's `params`, so query-string filtering (status/priority) is delegated entirely to the backend rather than done by hand-building URLs.

**Why a thin wrapper instead of calling `api.get(...)` inline in components:** it gives every task-related network call one name and one place to change if an endpoint's path or payload shape changes, and it keeps page components focused on UI state rather than URL construction.

---

## 9. User API Integration

`src/services/api/auth.api.js` covers both authentication and user-management endpoints (there's no separate `user.api.js` — user CRUD lives alongside auth because the backend groups them under `/auth`):

```js
loginUser(credentials)   // POST   /auth/login
createUser(userData)     // POST   /auth/users
getCurrentUser()         // GET    /auth/me
getUsers()                // GET    /auth/users
deleteUser(userId)        // DELETE /auth/users/:id
```

`createUser` is used both conceptually for "registration" and, in practice, exclusively from the **admin** "Add User" dialog (`dashboard/admin/users/page.js`) — there is no public self-registration page in `src/app`.

---

## 10. Form Handling with React Hook Form

All three forms in the app (`login/page.js`, `AdminUsersPage`'s create-user dialog, `CreateTaskDialog`) follow the same pattern:

```jsx
const form = useForm({
  resolver: zodResolver(someSchema),
  defaultValues: { /* ... */ },
});

<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Email</FieldLabel>
      <Input {...field} aria-invalid={fieldState.invalid} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

**Why `Controller` instead of `register()`:** the shadcn/ui `Field`/`Input`/`Select` components need `fieldState` (specifically `fieldState.invalid` and `fieldState.error`) rendered alongside the input for inline validation styling (`data-invalid`, `aria-invalid`, `FieldError`). `Controller`'s render-prop gives access to both `field` and `fieldState` together, whereas plain `register()` only wires up the input's value/onChange.

Submission state is read directly off `form.formState.isSubmitting` to disable submit buttons and swap their label (e.g. `"Creating..."`), rather than tracking a separate `isLoading` boolean — this keeps submit-button state in sync with the form's own async lifecycle instead of a second piece of state that could drift out of sync.

Server-side (API) errors are handled outside the form/schema layer: each `onSubmit` catches Axios errors, reads `error.response?.data?.message`, and surfaces it via both a local `serverError` string shown under the form and a `toast.error(...)` call — because Zod validates only shape/format client-side and can't know about backend-only failures (e.g. duplicate email).

---

## 11. Zod Validation

Three schemas in `src/schemas/`, each matching exactly the fields their corresponding form/API needs:

```js
// auth.schema.js
loginSchema = z.object({
  email: z.string().min(1, "Email is required.").pipe(z.email({ error: "Please enter a valid email" })),
  password: z.string().min(1, "Password is required"),
});

// user.schema.js
UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().min(1).pipe(z.email({ error: "..." })),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "ADMIN"], { error: "Please select a role" }),
});

// task.schema.js
createTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"], { error: "Please select a priority" }),
  assignedTo: z.string().min(1, "Please assign the task to a user"),
  dependencies: z.array(z.string()),
});
```

**Why `.min(1, ...).pipe(z.email(...))` instead of `z.string().email()` directly:** chaining a required-field check first produces a distinct "Email is required" message when the field is empty, and a separate "Please enter a valid email" message only once something has been typed — a small but deliberate UX distinction between "you forgot this" and "what you entered isn't valid."

The `priority`/`role`/`status` enums mirror the backend's fixed value sets exactly (`LOW/MEDIUM/HIGH`, `USER/ADMIN`, `TODO/IN_PROGRESS/DONE`), so invalid values are caught in the form before a request is ever sent, rather than relying solely on a 400 response from the API.

`zodResolver` (`@hookform/resolvers/zod`) is the sole integration point between Zod and React Hook Form — schemas are otherwise plain, standalone Zod objects with no React Hook Form–specific code in them, so they could be reused (e.g. for a hypothetical non-form validation) without modification.

---

## 12. Admin Dashboard

`src/app/dashboard/admin/page.js` is a read-only overview: it fetches `getUsers()` and `getAllTasks()` in parallel with `Promise.all`, then derives all displayed numbers **client-side** from the raw task list — total users, total tasks, `TODO`/`IN_PROGRESS`/`DONE`/pending counts are all computed with `Array.filter(...).length` on every render, not fetched as pre-aggregated stats from the backend.

**Why compute stats client-side instead of a dedicated `/stats` endpoint:** the backend doesn't expose one; the frontend already has the full task list in memory (needed for the "Task Overview" breakdown), so deriving counts from it avoids a redundant network round trip for numbers that are cheap to compute from data already on hand.

The page shows a `Card` grid of stat tiles (`Users`, `ListTodo`, `CheckCircle2`, `Clock3` icons from Lucide) followed by a "Task Overview" card that further breaks pending tasks down into Todo / In Progress / Done sub-counts.

---

## 13. User Dashboard / My Tasks

`src/app/dashboard/user/page.js` ("My Tasks") is the regular-user landing page. Unlike the admin task list, filtering here is **server-side**: `status`/`priority` are included in the `filters` object passed to `getMyTasks(filters)`, and a `useEffect` re-fetches whenever either changes:

```js
useEffect(() => { loadTasks(); }, [status, priority]);
```

**Why server-side filtering here but client-side filtering on the admin tasks page:** `getMyTasks` already accepts filter params server-side (mirroring `getAllTasks`), and since a user's own task list is expected to be small and scoped to them, refetching on every filter change is cheap and keeps the returned list authoritative. Contrast with [Task Filtering and Search](#17-task-filtering-and-search) below, where the admin page adds a free-text search that the backend doesn't support, forcing a client-side filter step regardless.

Each task card renders its own `Select` for status, so a user can update an individual task's status inline (`handleStatusChange` → `updateTaskStatus` → toast → `loadTasks()` refetch) without opening a separate dialog — unlike the admin flow, which routes status changes through `TaskDetailsDialog`.

---

## 14. Task Creation

`src/components/tasks/CreateTaskDialog.jsx` is a controlled dialog (`open`/`onOpenChange` passed from the parent page) used only from `dashboard/admin/tasks/page.js` — task creation is an admin-only capability in the UI (there's no create-task entry point on the user dashboard).

Key behaviors:
- Resets the form to its default values whenever the dialog closes (`useEffect` on `open`), so reopening it never shows stale data from a previous session.
- Dependency selection is a checkbox list of all existing tasks (excluding none explicitly — see [Dependency UX](#18-dependency-ux)), driven by manual `form.setValue("dependencies", ..., { shouldValidate: true })` calls in `toggleDependency`, rather than a native multi-select, because the row needs a task title + status shown per checkbox.
- On success, it calls the parent-supplied `onTaskCreated()` callback (which is `loadTasks` from the parent page) rather than managing the task list itself — keeping the dialog only responsible for the create flow, and the parent responsible for the list's source of truth.

---

## 15. Task Details Dialog

`src/components/tasks/TaskDetailsDialog.jsx` is the single surface for viewing, updating the status of, and deleting a task (used from the admin tasks page when a row's "View" button is clicked).

It receives the full `tasks` and `users` arrays as props (already loaded by the parent) and resolves relationships **client-side**:

```js
const assignedUser = users.find((user) => user.id === task.assignedTo);
const dependencies = (task.dependencies || [])
  .map((depId) => tasks.find((item) => item.id === depId))
  .filter(Boolean);
const incompleteDependencies = dependencies.filter((d) => d.status !== "DONE");
```

**Why resolve dependency/assignee objects here instead of the backend embedding them:** the API returns tasks with plain ID references (`assignedTo`, `dependencies: [id, ...]`); since the parent page already has the full `users`/`tasks` lists in state for other purposes (filters, table rendering), passing them down and joining locally avoids a second network fetch per dialog open.

Status updates are blocked in the UI before they're even attempted: the `DONE` option in the status `Select` is given `disabled={hasIncompleteDependencies}`, and `handleStatusUpdate` re-checks the same condition and shows a `toast.error` if somehow reached — see [Dependency UX](#18-dependency-ux).

Deletion uses a native `window.confirm(...)` rather than a styled confirmation dialog (contrast with the admin Users page, which uses a shadcn `Dialog` for delete confirmation) — this is an inconsistency in the current implementation, not an intentional design choice documented anywhere in the code.

---

## 16. User Management

`src/app/dashboard/admin/users/page.js` combines a searchable user table with two dialogs: "Add User" (a full React Hook Form + Zod form, `UserSchema`) and a delete-confirmation `Dialog`.

Notable implementation details:
- The create-user form and its dialog's open state are decoupled deliberately: closing the dialog (`onOpenChange(false)`) also calls `form.reset()`, so cancelling never leaves stale input for next time, mirroring the reset behavior in `CreateTaskDialog`.
- Deletion is a two-step flow: clicking "Delete" only sets `deleteUserId`, which drives a separate confirmation `Dialog` (`open={Boolean(deleteUserId)}`) — the actual `deleteUser` call only fires from that dialog's confirm button. This is the delete pattern used here as the safer, explicit-confirmation counterpart to `TaskDetailsDialog`'s `window.confirm`.
- The user's initial (`user.name?.charAt(0)?.toUpperCase()`) is used as a lightweight avatar in the table instead of an image — there is no avatar upload/URL field anywhere in the schemas or API.

---

## 17. Task Filtering and Search

Two different filtering strategies exist side by side, driven by what each backend endpoint supports and what UX each page needs:

- **Admin tasks page** (`dashboard/admin/tasks/page.js`): loads *all* tasks once, then filters entirely in-memory with a single `.filter()` combining free-text `search` (matched against `title` and `description`, case-insensitive) with `status`/`priority` equality checks. This is necessary because free-text search isn't a backend query parameter — it only exists as a UI feature.
- **User dashboard** (`dashboard/user/page.js`): has no search box, only `status`/`priority` selects, and passes them straight through to `getMyTasks(filters)` as backend query params (see [User Dashboard](#13-user-dashboard--my-tasks)).

Both pages share the same `formatStatus`/`formatPriority` string-formatting helpers (turning `IN_PROGRESS` into "In Progress", `HIGH` into "High"), duplicated independently in each file rather than extracted to a shared utility — a candidate for consolidation, but not something currently factored out in the source.

---

## 18. Dependency UX

Task dependencies are represented as an array of task IDs (`task.dependencies: string[]`) and surfaced in two places:

1. **Creation** (`CreateTaskDialog`): a scrollable checklist (`ScrollArea` + `Checkbox` per task) lets the admin pick zero or more existing tasks as dependencies. If no tasks exist yet, the list is replaced with a "No existing tasks available" placeholder rather than an empty scroll area.
2. **Viewing/completing** (`TaskDetailsDialog`): dependencies are resolved to full task objects and listed with a completion icon (`CheckCircle2` if `status === "DONE"`, `Clock3` otherwise). If any dependency isn't `DONE`, the dialog:
   - disables the `DONE` `SelectItem` directly (`disabled={hasIncompleteDependencies}`),
   - shows an inline amber warning card ("Task is blocked ... Complete all dependencies before marking this task as done."),
   - and defends the same rule again in `handleStatusUpdate`'s logic before calling the API.

**Why enforce this in three places (disabled option, warning banner, submit-time check) instead of just relying on a backend rejection:** the backend may also reject an invalid `DONE` transition, but duplicating the check client-side means the user sees *why* an action is unavailable before attempting it, rather than submitting and receiving a generic error toast — the disabled state and banner are purely explanatory UX layered on top of a check that would otherwise be silently enforced only in `handleStatusUpdate`.

---

## 19. Loading / Error / Empty States

Every data-fetching page/component follows the same three-state pattern using local `useState` (`isLoading`, `error`, and the fetched data array), with no shared hook or component abstracting it:

- **Loading:** an inline `<LoaderCircle className="animate-spin" />` with descriptive text ("Loading tasks...", "Loading your tasks...", etc.), shown in place of the content area — not a full-page spinner.
- **Error:** a `Card` showing `error.response?.data?.message` (falling back to a page-specific default string) alongside a "Retry" button that re-runs the same load function.
- **Empty:** a centered icon + heading + helper text (e.g. "No tasks found" / "Create your first task to get started."), with a contextual call-to-action button when appropriate (e.g. "Create Task" shown only when there are zero tasks at all, not when filters simply match nothing).

**Why duplicate this per page instead of a shared `<AsyncState>` wrapper:** the three-state logic is consistent in shape but the actual copy, icon, and CTA differ meaningfully per page (e.g. "No tasks found" vs. "No users found," a create button on the tasks page but not always shown), so each page inlines its own version rather than sharing a generic component — a pattern that trades some duplication for page-specific copy without prop-driven abstraction.

---

## 20. Toast Notifications

Sonner's `<Toaster />` is mounted once in the root layout, alongside `AuthProvider`/`AuthGuard`, so `toast.success(...)`/`toast.error(...)` can be called from any client component without additional setup.

Toasts are used consistently for the *result* of a mutation (login, create task, update status, delete task, create user, delete user) — always paired with, not instead of, inline error text where a form is involved (e.g. login's `serverError` paragraph, `CreateTaskDialog`'s `serverError` paragraph). The toast gives an ambient, auto-dismissing confirmation; the inline text gives a persistent, in-context explanation for form-blocking errors specifically.

---

## 21. Responsive Design

Responsiveness is handled entirely through Tailwind's responsive utility variants (`sm:`, `md:`, `lg:`, `xl:`) rather than JS-driven breakpoint logic in most places:

- Stat card grids collapse from multi-column to single-column below `sm`/`xl` (e.g. `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`).
- Page headers stack vertically on small screens and go row-oriented at `sm:` (`flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`).
- The admin tasks page's filter bar uses a responsive grid template (`md:grid-cols-[minmax(0,1fr)_180px_180px_auto]`) that only applies at `md` and above, implying a stacked, single-column filter layout below that.
- Tables are wrapped in `overflow-x-auto` containers so wide task/user tables scroll horizontally on narrow viewports instead of breaking layout.

The one JS-based responsive hook in the codebase, `src/hooks/use-mobile.js` (`useIsMobile`, breakpoint `768px`, backing the shadcn `Sidebar`'s mobile/sheet behavior), is consumed internally by `components/ui/sidebar.jsx` rather than called directly in any page — so responsive sidebar collapsing is handled by the shadcn primitive, not custom page code.

---

## 22. Component Reusability

Reusability in this codebase happens at two distinct levels:

1. **shadcn/ui primitives** (`src/components/ui/*`) — generated, general-purpose building blocks (`Button`, `Card`, `Dialog`, `Select`, `Table`, `Field`, etc.) used identically across admin and user pages. These are the majority of the component tree by file count and are not hand-written per-feature.
2. **Feature components** (`src/components/auth`, `src/components/layout`, `src/components/tasks`) — a small, deliberately narrow set: `AuthProvider`, `AuthGuard`, `AppSidebar`, `CreateTaskDialog`, `TaskDetailsDialog`. Notably, there is no shared `TaskCard`, `TaskTable`, or `StatCard` component — the admin tasks table, the user dashboard's task cards, and both pages' stat tiles are each written inline in their respective page files, with near-duplicate JSX/formatting logic (e.g. `formatStatus`/`formatPriority` reimplemented in three places: `dashboard/admin/tasks/page.js`, `dashboard/user/page.js`, and `TaskDetailsDialog.jsx`).

This means the current reuse boundary is "shared UI primitives, page-specific composition" — there isn't a shared domain-component layer (e.g. no `<TaskRow>` used by both the admin table and a hypothetical mobile task list) yet.

---

## 23. Environment Variables

The frontend reads exactly one environment variable:

| Variable | Used in | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `src/services/api/api.js` | `baseURL` for the shared Axios instance; must point at the Express backend (e.g. `http://localhost:5000/api/v1`, matching the backend's documented base path) |

No `.env`/`.env.example` file ships in the `client/` directory in this repository, so it must be created manually (e.g. `client/.env.local`) before running the app. Because the variable is prefixed `NEXT_PUBLIC_`, it is inlined into the client bundle at build time, per standard Next.js behavior — there is no server-only configuration in this frontend given the static-export setup.

---

## 24. Local Development

From `client/`:

```bash
npm install
# create client/.env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

npm run dev     # next dev
```

Other available scripts (from `package.json`): `npm run build` (`next build`, produces the static export per `output: "export"`), `npm run start` (`next start`), `npm run lint` (`eslint`).

The frontend expects the backend (`server/`) to be running separately and reachable at `NEXT_PUBLIC_API_URL` — there is no proxy or rewrite configured in `next.config.mjs`, so CORS on the backend (`cors` middleware, per the backend's own documentation) is what allows the two to communicate across ports in development.