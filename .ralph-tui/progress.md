# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Logging en frontend**: nunca usar `console.*` directamente en `frontend/src`. Importar `logger` desde `utils/logger` (`import logger from "../utils/logger"`) y usar `logger.debug/info/warn/error`. `debug`/`info` se silencian con `NODE_ENV === 'production'`; `warn`/`error` siempre salen. La comprobación de entorno es por llamada, así que los tests pueden alternar `process.env.NODE_ENV` sin `jest.resetModules()`.
- **Estilo de comillas en frontend**: `src/core/*.js` usa comillas simples en imports; `src/components`, `src/pages`, `src/context` usan dobles. Al añadir imports, respetar el estilo del archivo.
- **Grep en zsh**: `--include=*.js` sin comillas falla con "no matches found"; usar `--include='*.js'`.

---


## 2026-09-17 - US-001
- Creado `frontend/src/utils/logger.js` con `{ debug, info, warn, error }`; `debug`/`info` no imprimen en producción, `warn`/`error` siempre delegan a `console`.
- Reemplazados los 88 `console.error/log/warn` de `frontend/src` (29 archivos en core, context, components, pages, pages/administration) por `logger.*`, añadiendo el import tras el último import de cada archivo.
- Reescrito el comentario de CRA en `index.js` (`reportWebVitals(console.log)` → `reportWebVitals(logger.debug)`) para que el grep de aceptación quede limpio.
- Añadido `frontend/src/utils/__tests__/logger.test.js` (8 tests: producción vs development para los cuatro niveles).
- Verificado: grep de aceptación vacío, `npm run typecheck`, `npx eslint 'src/**/*.{js,jsx}'` y `CI=true npx react-scripts test --watchAll=false` (12 suites, 64 tests) pasan.
- Files changed: `frontend/src/utils/logger.js` (nuevo), `frontend/src/utils/__tests__/logger.test.js` (nuevo), `frontend/src/index.js`, `frontend/src/context/PermissionContext.js`, `frontend/src/core/{Setting,Autentication,Audit,Projects,Admin,Document}.js`, `frontend/src/components/{ProjectsTable,CommentsPanel,EditProject,DocumentComparePopup,NotificationBell,SubirDocumento,NewProject}.jsx`, `frontend/src/pages/{TutorDashboard,ViewProjectsStudents,AuditLogs,CoordinatorDashboard,ProyectoDetalle,Administration,Login,ProjectsAsignedTutor,DocumentViewer,StudentDashboard}.jsx`, `frontend/src/pages/administration/{SettingsTab,AuditTab,UsersTab,RolesTab}.jsx`.
- **Learnings:**
  - Casi todo el ruido era `console.error` (84 de 88); solo había 4 `console.log` y 1 `console.warn`. Los `console.log` eran mensajes de "no se encontró userData en localStorage" que ahora son `logger.debug` y desaparecen en producción.
  - El grep de aceptación también atrapa comentarios (`index.js` tenía `console.log` en un comentario de CRA); hay que limpiarlos igual.
  - CRA inyecta `process.env.NODE_ENV` en build, así que comprobar el entorno dentro de cada función (no en el top-level del módulo) permite tanto el tree-shaking en producción como alternar el entorno en tests.
  - Los tests existentes no espían `console.*`, así que el cambio no rompió ningún assert sobre la consola.
---
