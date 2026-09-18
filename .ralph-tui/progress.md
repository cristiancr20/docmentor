# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

*Add reusable patterns discovered during development here.*

- **Detectar JSX en `.js` de forma fiable (frontend):** el grep por `<Tag ...>` falla con JSX multilínea y fragmentos. Usar el parser sin el plugin jsx; cualquier archivo que no parsea contiene JSX (es exactamente lo que esbuild/Vite rechazará en `.js`):
  ```sh
  cd frontend && node -e '
  const p=require("@babel/parser"),fs=require("fs"),path=require("path");
  const walk=(d,o=[])=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);
    if(e.isDirectory()){if(!["k6","__tests__"].includes(e.name))walk(f,o)}else if(f.endsWith(".js"))o.push(f)}return o};
  for(const f of walk("src")){try{p.parse(fs.readFileSync(f,"utf8"),{sourceType:"module"})}catch(e){console.log("JSX:",f)}}'
  ```
- **Imports sin extensión en frontend/src:** todos los imports/`jest.mock` van sin `.js`/`.jsx`, así que renombrar la extensión de un módulo no requiere tocar importadores. Las configs (`tailwind.config.js`, `eslint.config.mjs`, `tsconfig.json`, `jest.transform`) ya incluyen `.jsx`.
- **Verificar el dev server de Vite sin navegador (frontend):** `npm start` en background y `curl` contra `http://localhost:3000`: el HTML debe incluir `<script type="module" src="/src/index.jsx">`; `curl /src/core/config.js` muestra el `import.meta.env` inyectado (sirve para comprobar que `.env` se leyó); `curl -sI /pdf.worker.js` debe dar 200 (assets de `public/` se sirven en raíz); y `curl /src/index.css | grep '\.bg-surface'` confirma que PostCSS+Tailwind están activos. Terminar con `pkill -f vite`.
- **Tests con Vitest (frontend):** `vi` es global (`test.globals: true`), no hace falta importarlo. Tres diferencias con Jest que rompen tests al migrar: (1) el factory de `vi.mock` debe devolver la forma del módulo, así que una export por defecto va como `() => ({ default: ... })`, nunca `() => vi.fn()` ni `() => "valor"`; (2) si el código hace `new Mock()`, la `mockImplementation` debe ser una `function` normal, no una arrow (Vitest ≥ 4 lanza "is not a constructor"); (3) el entorno se alterna con `vi.stubEnv("MODE", "production")` + `vi.unstubAllEnvs()` en `afterEach`, no asignando `process.env.NODE_ENV`. `vite.config.js` lleva `test.mockReset: true` (equivale al `resetMocks` de CRA) y `src/setupTests.js` instala un mock propio de `localStorage` con `vi.fn()` y almacén en memoria.
- **Módulos ESM vs CJS en la raíz de frontend:** `package.json` no tiene `"type": "module"` porque `tailwind.config.js` y `babel.config.js` usan `module.exports`. `vite.config.js` y `postcss.config.js` están en ESM igualmente y Vite los carga (con un aviso de `configLoader: 'native'`). Si se añade `"type": "module"` hay que convertir antes esos dos `.js` CJS (o renombrarlos a `.cjs`).

---

## 2026-09-17 - US-001
- Renombrados con `git mv` a `.jsx` los archivos de `frontend/src` que contienen JSX: `index.js`, `App.js`, `context/AuthContext.js`, `context/PermissionContext.js`, `utils/useAppTheme.js` (los 5 del AC) y además `components/PermissionGate.js` (JSX real, fragmento `<>…</>`, que el grep del AC no detecta).
- No hubo que tocar imports: todos los importadores usan rutas sin extensión (`from "./App"`, `from "../context/AuthContext"`, `jest.mock("../../context/PermissionContext")`), y CRA/Jest/tsc resuelven `.jsx` sin cambios. `tailwind.config.js` (`./src/**/*.{js,jsx,ts,tsx}`), `eslint.config.mjs` (`**/*.{js,mjs,cjs,jsx}`), `tsconfig.json` (`include: ["src"]`) y el `jest.transform` de package.json (`^.+\.(js|jsx)$`) ya cubrían `.jsx`: verificado, sin cambios.
- `src/index.jsx` lo resuelve CRA sin cambios en `public/index.html` (react-scripts usa `resolveModule` sobre `src/index` probando `.jsx`).
- Actualizados dos comentarios que citaban `App.js` (`components/layout/navigation.js`, `components/__tests__/navigation.test.js`).
- Checks: `npm run typecheck` ✅, `npx eslint 'src/**/*.{js,jsx}'` ✅, `CI=true react-scripts test` ✅ (15 suites, 86 tests), `CI=false npm run build` ✅ (Compiled successfully).
- **Learnings:**
  - El grep `<[A-Za-z][^>]*>` del AC tiene falsos negativos y positivos: no detecta JSX multilínea cuyo `>` está en otra línea (`<AuthContext.Provider value={{` en AuthContext.js) ni fragmentos `<>…</>` (PermissionGate.js); y marca `useAppTheme.js` solo por un `<html>` en un comentario (no tiene JSX; se renombró igualmente por estar en el AC). La detección fiable es parsear con `@babel/parser` sin el plugin `jsx`: lo que falla al parsear es lo que esbuild/Vite rechazará (ver patrón en Codebase Patterns).
  - `useAppTheme.jsx` solo se importa desde `components/PdfViewer.tsx`; no queda ningún `.js` con JSX en `src/` (fuera de `k6/` y `__tests__/`).
---

## 2026-09-17 - US-002
- `npm install -D vite @vitejs/plugin-react` (vite ^8.3.0, plugin-react ^6.1.1) y `npm uninstall react-scripts`.
- Nuevos `frontend/vite.config.js` (plugin react, `server.port 3000`, `server.host true`, `build.outDir 'dist'`) y `frontend/postcss.config.js` (tailwindcss + autoprefixer).
- `git mv public/index.html index.html`: `%PUBLIC_URL%/x` → `/x` (favicon, logo192, manifest) y `<script type="module" src="/src/index.jsx">` antes de `</body>`.
- `src/core/config.js` → `import.meta.env.VITE_API_URL`; `src/setupPdfWorker.js` → `${import.meta.env.BASE_URL}pdf.worker.js`; `src/utils/logger.js` → `import.meta.env.MODE === "production"` (era `process.env.NODE_ENV`, no estaba en el AC pero el AC exige cero `process.env` en `src` fuera de tests).
- `.env` y `.env.example`: `REACT_APP_API_URL` → `VITE_API_URL` (mismo valor). `tsconfig.json`: `"types": ["vite/client"]`. `.gitignore`: `/dist`.
- `package.json`: scripts `start=vite`, `build=vite build`, `preview=vite preview`; `test` sin tocar (sigue apuntando a react-scripts, ya desinstalado: los tests no corren hasta US-003); eliminados `browserslist` y `jest`.
- Checks: `npm run typecheck` ✅, `npx eslint 'src/**/*.{js,jsx}'` ✅, `npm run build` ✅ (genera `dist/index.html` y `dist/pdf.worker.js`), `npm start` ✅ en `http://localhost:3000` (HTML sirve `/src/index.jsx`, `.env` inyectado, `/pdf.worker.js` 200, utilidades Tailwind generadas).
- **Learnings:**
  - `logger.test.js` alterna `process.env.NODE_ENV`; con `import.meta.env.MODE` en el módulo, en US-003 debe pasar a `vi.stubEnv("MODE", "production")` (o asignar `import.meta.env.MODE`). La comprobación sigue siendo por llamada, así que no hace falta reimportar.
  - Vite 8 (rolldown) avisa en build de un `eval` en `pdfjs-dist/build/pdf.js` y de un chunk > 500 kB: son avisos, no errores; la app ya cargaba el worker desde `public/pdf.worker.js`, así que no afecta.
  - Vite avisa de que `vite.config.js` usa ESM sin `"type": "module"`; se dejó así a propósito (ver Codebase Patterns) para no romper `tailwind.config.js` ni `babel.config.js` (CJS). Candidato natural para resolver en US-005 al borrar `babel.config.js`.
  - `typescript@4.9.5` tipa `vite/client` sin problema con `skipLibCheck: true`.
  - El comentario HTML de `index.html` que menciona el antiguo `<script src="https://unpkg.com/...pdf.worker.min.js">` sobrevive al build de Vite (CRA lo eliminaba al minificar). Es un comentario, no carga nada.
---

## 2026-09-17 - US-003
- `npm uninstall jest jest-environment-jsdom babel-jest jest-junit jest-localstorage-mock github-actions-ctrf` (ningún archivo ni workflow los referenciaba; `unit_test_backend.yml` usa el Jest del backend, que no se toca) y `npm install -D vitest jsdom @vitest/coverage-v8` (vitest ^5.0.1, jsdom ^30.1.0). Hubo que desinstalar antes: `jest-environment-jsdom` fijaba `jsdom@20` y npm daba ERESOLVE al instalar el `jsdom` moderno.
- `vite.config.js`: bloque `test` con `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/setupTests.js'`, `mockReset: true`, `css: false`, `coverage.reporter: ['text', 'lcov']`.
- `src/setupTests.js`: `import '@testing-library/jest-dom/vitest'` (la 6.6.3 instalada exporta `./vitest`); fuera `dotenv` y `jest-localstorage-mock`; mock propio de `localStorage` (`getItem/setItem/removeItem/clear/key` como `vi.fn()` con almacén en memoria, `Object.defineProperty(window, 'localStorage', ...)`) que se vacía y resetea en `beforeEach`.
- 15 archivos de `src/**/__tests__`: `jest.*` → `vi.*` (perl `s/\bjest(?=\s*\.)/vi/g`, que también cubre el `jest\n  .fn()` multilínea de `useProjects.test.js`). Ajustes manuales: `GeneratePdfButton.test.jsx` (factories de png y `jspdf-autotable` devuelven `{ default }`; `jsPDF.mockImplementation(function () {...})` para que sea construible), `logger.test.js` (`vi.stubEnv("MODE", ...)` / `vi.unstubAllEnvs()`), comentario de `AuthContext.test.jsx`.
- `package.json`: `test = vitest run --coverage`, nuevo `test:watch = vitest`. `eslint.config.mjs`: `globals.jest` → `globals.vitest`.
- Checks: `npm test` ✅ (15 archivos, 86 tests: el mismo número que daba Jest en US-001; el "8 suites / 46 tests" del AC es de una foto anterior del repo), `npm run typecheck` ✅, `npx eslint 'src/**/*.{js,jsx}'` ✅, `npm run build` ✅.
- **Learnings:**
  - Ver patrón "Tests con Vitest" en Codebase Patterns (forma del módulo en `vi.mock`, mocks construibles, `vi.stubEnv`).
  - En Vitest ≥ 3 `mockReset` restaura la implementación original pasada a `vi.fn(impl)` (no la deja en `undefined` como Jest), así que con `mockReset: true` el mock de `localStorage` recupera solo su almacén en memoria tras cada test.
  - `@testing-library/jest-dom/vitest` extiende `expect` de Vitest directamente; con `globals: true` no hay que importar `expect` en los tests.
  - Vitest carga `.env`/`.env.test` por sí mismo (`import.meta.env`), por eso sobra `dotenv`. La devDependency `dotenv` queda ya sin ningún uso en frontend: candidata a borrar en US-005 junto con `@babel/*`, `babel.config.js` y `@babel/core` (que sigue en `dependencies`).
  - Vitest avisa de que jsdom se crea 15 veces (uno por archivo); es solo rendimiento (~4 s en total), no hace falta tocar `pool`/`isolate`.
---

## 2026-09-17 - US-004
- `frontend/Dockerfile`: comentarios de la etapa de producción pasan de `/app/build` a `/app/dist` (`COPY --from=build /app/dist ...`); base `node:20-alpine` y `CMD ["npm","start"]` sin cambios (Vite 8 acepta `^20.19.0`, y `vite.config.js` ya fija `host: true` + puerto 3000).
- `docker-compose.yml`: en `react` se elimina `CHOKIDAR_USEPOLLING` (era de webpack) y se añade `VITE_API_URL: http://localhost:1337`; `3000:3000` intacto.
- `.github/workflows`: ninguno referenciaba `frontend/build` (verificado con grep en build_frontend, slint, sast, sca). Sí hubo que subir Node en `build_frontend.yml` (18.20.4 → 22) y `slint.yml` (matrix 18.20.5 → 22): Vite 8 exige `^20.19.0 || >=22.12.0` y Vitest 5 / jsdom 30 `>=22.12.0`, así que `npm run build` habría fallado en CI con Node 18. `sast.yml` se deja en 18.20.5 porque su matrix incluye el backend (`engines: >=18 <=20`) y su `npm run build || echo` ya tolera el fallo.
- Nuevo `frontend/vercel.json` con el rewrite `/(.*)` → `/index.html` (SPA fallback para react-router).
- `README.md`: `REACT_APP_API_URL` → `VITE_API_URL` (con nota del prefijo `VITE_`), `npm start` descrito como dev server de Vite, sección de depuración menciona `frontend/dist` y `npm run preview`, tecnologías: `React 18.x + Vite`.
- Checks: `npm run build` ✅, `npm run typecheck` ✅, `npx eslint 'src/**/*.{js,jsx}'` ✅, `vercel.json` parsea, `docker-compose.yml` parsea (servicio `react` verificado con el paquete `yaml`). **No se pudo ejecutar `docker compose build react`**: el daemon de Docker no está arrancado y el plugin `compose` no está instalado en esta máquina.
- **Learnings:**
  - `frontend/Dockerfile` tiene finales de línea CRLF: los `perl -0pi` con `\n` no casan; usar `perl -pi` línea a línea con `\r$` (o `s/\r?\n/`) para conservar CRLF.
  - Las versiones de Node de los workflows (18.x) quedaron por debajo del mínimo de Vite/Vitest; cualquier workflow nuevo del frontend debe usar Node 22. El backend (Strapi) sigue limitado a `<=20.x`, así que los workflows con matrix frontend+backend (sast.yml) no pueden compartir una sola versión sin separar el matrix.
---
