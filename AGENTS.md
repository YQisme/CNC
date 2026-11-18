# Agent notes — CNC Simulator 

This project is a **Vue 3 + Vite + Element Plus + TresJS + Pinia** SPA.

- Package manager: **Yarn**
- Dev: `yarn dev` (http://localhost:3000)
- Build: `yarn build` → static files in `dist/`
- Path alias: `@/` → `src/`
- Simulation state: `src/stores/sim.ts`
- View/camera state: `src/stores/view.ts`
- Pure G-code / carve logic: `src/lib/cnc/`
- 3D scene: `src/components/cnc/CncScene.vue` + TresJS (`@tresjs/core`, `@tresjs/cientos`)
