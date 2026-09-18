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
