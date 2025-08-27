## AI Assistant Instructions (PartijTrade / ImpexDeals)

Concise, project-specific guidance for autonomous AI changes. Focus on existing patterns; avoid inventing backend logic (currently all client-side, localStorage-based).

### 1. Stack & Entry
- React 19 + TypeScript + CRA (`react-scripts`).
- UI: MUI v7 (import from `@mui/material`). Extra CSS modules + plain CSS (`*.css`).
- Routing: React Router v6 configured in `App.tsx` (single top AppBar; no side Drawer anymore despite legacy `Layout.tsx`).

### 2. Core Domain Modules
- `src/services/productService.ts`: LocalStorage CRUD + seeding (key `impex_products_v1`). Converts File -> base64 for images. Always call getter functions instead of touching internal `products` array.
- `src/services/authService.ts`: Simple credential validation (admin/demo). Persists current user (key `auth_current_user_v1`). Roles: `admin | user`; optional `canUpload` flag.
- Future additions should mirror pattern: in‑module state + `load()` + `persist()` + versioned LS key.

### 3. Social / Community Layer
- `src/pages/Social.tsx`: In-memory + LS persisted feed (`social_posts_v1`) and follow suggestions (`social_follow_v1`).
  - Post fields include cached counts + booleans (`liked`, `saved`, `openComments`).
  - Auth gating: All mutating actions (post, like, save, follow, comment, delete) return early if no user.
  - Time progression: `minutesAgo` increments every minute for posts & comments via intervals.
  - Infinite scroll: window scroll listener auto-appends synthetic archive posts.
  - When extending, preserve LS write side-effects (React effect hooks on dependency arrays) and early-return auth checks.

### 4. Admin & Profile
- `src/pages/admin/AdminPanel.tsx`: Manages a user list separate from auth service (key `admin_users_v1`). Provides edit modal + toggle role/upload flags. DO NOT unify silently with authService without explicit instruction—different data shape (name vs username).
- `src/pages/Profile.tsx`: Rich client-only profile metadata (key `profile_meta_v1`). Tabs: Profiel / Instellingen / Privacy / Notificaties / Voorkeuren. Updating username calls `setCurrentUser` to keep auth in sync. Interest & color selections mutate `meta` then auto-persist via effect.

### 5. UI / Styling Conventions
- Use MUI `sx` for component-scoped styling; custom global styles in `App.css` include adaptive logo class `.impex-logo-adaptive` (outline + shadow for contrast).
- Avatars and dynamic colors often applied via `data-*` attributes (e.g., `data-avatar`, `data-color`) then styled in CSS—reuse pattern instead of inline hex styles.
- Keep new component files < ~250 lines; extract subcomponents (e.g., comment forms) when complexity grows.

### 6. LocalStorage Keys (Versioned)
`impex_products_v1`, `auth_current_user_v1`, `social_posts_v1`, `social_follow_v1`, `admin_users_v1`, `profile_meta_v1`.
When adding new persisted feature (e.g., favorites): adopt `snake_case_v1`, implement `load()` w/ fallback seed, guard LS operations in try/catch.

### 7. Patterns to Follow
- Auth gating: replicate the simple `if (!user) return;` guard before any mutating state update.
- State persistence: side-effect `useEffect(()=> save(), [state])` rather than embedding `localStorage.setItem` in every handler (Social & Admin use mixed approach—prefer single consolidated effect for new code if possible).
- ID generation: Use `Date.now().toString()` + random segments or `crypto.randomUUID()` (images).
- Sorting: Products sorted newest-first (`createdAt` descending) inside service; consumers should not re-sort.

### 8. Adding Favorites (Example Flow)
1. Create `src/services/favoriteService.ts` with internal `Set<string>`; keys persisted under `favorites_v1`.
2. Expose: `getFavorites()`, `isFavorite(id)`, `toggleFavorite(id)` -> persist after mutation.
3. In product or catalog cards add favorite button; disable if not logged in (mirror Social gating).

### 9. Error / Edge Handling
- All LS interactions wrapped in try/catch; replicate to avoid quota / private mode crashes.
- On missing product ID in detail page, show graceful fallback + navigation link back (pattern expected even if minimal now).

### 10. Testing & Scripts
- Standard CRA scripts only. No custom Jest config yet. Keep services framework-agnostic to simplify future unit tests.

### 11. Naming & Files
- Domain terms are Dutch (e.g., `PartijenOverzicht`, `PartijPlaatsen`)—continue consistent language for new marketplace pages.
- Keep version suffix on new persistent keys for migrations later.

### 12. Safe Change Checklist (Before PR / Completion)
1. Type definitions updated (if new data shape). 
2. LocalStorage key chosen & versioned. 
3. Auth gating added where mutation occurs. 
4. Effects persist state (or single save util). 
5. No inline long style objects duplicated—factor common values.

### 13. Quick File Map
- Routes & nav: `src/App.tsx`
- Products: `src/services/productService.ts`, `src/components/ProductCard.tsx`
- Auth: `src/services/authService.ts`
- Social: `src/pages/Social.tsx`
- Admin: `src/pages/admin/AdminPanel.tsx`
- Profile: `src/pages/Profile.tsx`
- Types: `src/types/product.ts`

Respond with concrete edits referencing these patterns; avoid speculative backend logic.
