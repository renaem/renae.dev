## Quick context

- This is an Angular (v20) single-page application with optional Server-Side Rendering (SSR) via `@angular/ssr` and an Express server.
- Browser app entry: `src/main.ts` → `AppModule` (`src/app/app.module.ts`).
- Server entry (SSR): `src/main.server.ts` → `AppServerModule` (`src/app/app.module.server.ts`).
- Express wrapper: `server.ts` (produces a Node server that uses `CommonEngine` from `@angular/ssr`).

## How to run (local dev & SSR)

- Normal dev server: `npm start` (runs `setenv.ts` and then `ng serve`).
- Build (production-ish): `npm run build` (runs `setenv.ts` and `ng build`).
- SSR: the repo builds server output into `dist/renae-dev/server` and browser files into `dist/renae-dev/browser`. The project defines `serve:ssr:renae-dev` which runs the built server: `node dist/renae-dev/server/server.mjs`.
- Note: `angular.json` includes `server` and `prerender` options but `ssr` is set to `false` in the provided configuration. Use the Angular CLI targets in `angular.json` when adjusting build/ssr behavior.

## Key patterns & conventions

- Styling: components use SCSS (default from schematics). See `src/styles.scss` and `src/app/**/*.scss`.
- Components are mostly traditional Angular NgModules (not standalone components). `NavMenuComponent` (`src/app/nav-menu/nav-menu.component.ts`) contains 3D rendering code using `three` and `animejs` — treat it as a performance-sensitive UI surface.
- Assets: large 3D/glTF and baked binary blobs live under `src/assets/renae_island/` — be careful when changing bundling or production hashing.
- HTTP: the app provides `provideHttpClient(withInterceptorsFromDi())` in `AppModule`; follow DI interception patterns if adding HTTP logic.

## Important files to reference when coding

- `package.json` — scripts and dependencies (Angular v20, @angular/ssr, three, animejs). Use exact scripts rather than inventing new ones.
- `angular.json` — build/serve/test targets and options. Use the configured `browser` and `server` entry points for any SSR builds.
- `server.ts` — Express server using `CommonEngine`. It serves `browser` output and invokes the Angular SSR engine for all other routes.
- `src/app/app.module.ts` and `src/app/app.module.server.ts` — browser and server modules; server module imports `ServerModule`.
- `src/assets/` — contains fonts, images, glTF and binary assets that are large; prefer referencing them by path as in existing code.

## What to watch for when editing

- SSR-safe code: keep browser-only APIs (window, document, canvas) guarded or only used in components that run client-side (e.g., inside lifecycle hooks such as `ngAfterViewInit`). Example: `NavMenuComponent` uses a canvas via `@ViewChild` — ensure it doesn't run during SSR.
- Long-running animations and WebGL resources should be created/destroyed in lifecycle hooks. If you add server-side logic, avoid importing `three` at top-level in server build files unless guarded.
- Large static assets should remain under `src/assets` so the build copies them into `dist/renae-dev/browser` (server uses that folder as static). See `server.ts` which serves that folder.

## Typical developer workflows (commands)

- Dev: npm install && npm start
- Run unit tests: npm test
- Build app: npm run build
- Run SSR server after building (example):
  1) ng build --configuration production
  2) ng run renae-dev:server:production (or use configured CLI server target)
  3) node dist/renae-dev/server/server.mjs

## Example code patterns to follow

- Client-only initialization: put canvas/Three.js setup in `ngAfterViewInit()` and guard with `if (this.canvas)` or similar. See `src/app/nav-menu/nav-menu.component.ts` for a working pattern.
- Use Angular DI for HTTP: `provideHttpClient(withInterceptorsFromDi())` and add interceptors/providers via DI.

## Integration & external deps

- three (0.148): used in `nav-menu.component.ts` and other 3D-related components. Loading glTF or binary models likely uses `three` loaders — search `GLTF` or `.gltf` under `src/assets`.
- animejs: used for animations in `nav-menu.component.ts`.
- @angular/ssr + express: used to render server-side via `CommonEngine` in `server.ts`.

If anything here is incomplete or you'd like more detail (examples, CLI snippets, or expanded notes about SSR pitfalls), tell me which areas to expand and I'll iterate. 
