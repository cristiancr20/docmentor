# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Logging en frontend**: nunca usar `console.*` directamente en `frontend/src`. Importar `logger` desde `utils/logger` (`import logger from "../utils/logger"`) y usar `logger.debug/info/warn/error`. `debug`/`info` se silencian con `NODE_ENV === 'production'`; `warn`/`error` siempre salen. La comprobación de entorno es por llamada, así que los tests pueden alternar `process.env.NODE_ENV` sin `jest.resetModules()`.
- **Estilo de comillas en frontend**: `src/core/*.js` usa comillas simples en imports; `src/components`, `src/pages`, `src/context` usan dobles. Al añadir imports, respetar el estilo del archivo.
- **Grep en zsh**: `--include=*.js` sin comillas falla con "no matches found"; usar `--include='*.js'`.
- **Errores en `core/*.js`**: las funciones son llamadas directas a `apiClient` (`return (await api.get(...)).data`), sin `try/catch` que solo loguee y relance: el interceptor de `apiClient` ya centraliza los errores y quien los maneja es la página/componente. Solo se envuelve en `try/catch` cuando el catch hace algo propio (devolver `null`/`[]`, tragar el error). Tampoco se pasa `Content-Type: application/json` a mano; axios lo pone solo con cuerpos de objeto (el `multipart/form-data` de `uploadFile` sí se mantiene).

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

## 2026-09-17 - US-002
- Eliminados todos los `try { ... } catch (e) { logger.error(...); throw e }` de `frontend/src/core/{Admin,Audit,Autentication,Document,Projects,Setting}.js`; las funciones simples quedan como `(await api.x(...)).data`. `Comments.js` y `Notification.js` ya no tenían envoltorios.
- Quitadas las cabeceras `Content-Type: application/json` a mano en `Projects.createProject`, `Document.createDocument` y `Document.copyDocumentAsNewVersion`.
- Retirado el import de `logger` de `Admin`, `Audit`, `Projects` y `Setting`. Se mantiene en `Autentication` y `Document`, que conservan catches con lógica propia.
- Catches conservados (notes):
  - `Autentication.getUserByEmail`: devuelve `null` si falla (DocumentViewer depende de ese valor por defecto).
  - `Document.getLastDocument`: devuelve `null` si falla (vía `handleError`).
  - `Document.markDocumentAsOld`: traga el error (vía `handleError`).
  - `Document.copyDocumentAsNewVersion`: traga el error y devuelve `undefined` (comportamiento histórico; sin consumidores actuales).
  - `Document.createDocument`: se quitó el `catch` (solo hacía `handleError` + `throw`) pero se mantiene el `try/finally` que libera el cerrojo `window.isUploadingDocument`.
- Borrados en `Projects.js` dos bloques comentados (versiones antiguas de `getProjectsByStudents`/`getProjectsByEmail`) que repetían el mismo patrón try/catch con `logger.error`.
- Verificado: `npm run typecheck`, `npx eslint 'src/**/*.{js,jsx}'` y `CI=true npx react-scripts test --watchAll=false` (12 suites, 64 tests) pasan.
- Files changed: `frontend/src/core/{Admin,Audit,Autentication,Document,Projects,Setting}.js`.
- **Learnings:**
  - En `Projects.getProjectsByTutor/ByEmail/ByStudents` el `throw new Error("Tutor no encontrado...")` vivía dentro del `try`, así que era capturado, logueado y relanzado; quitar el envoltorio no cambia lo que recibe el consumidor.
  - Los tests de componentes mockean `core/Projects`, `core/Comments` y `core/Notification` con `jest.mock`, así que no dependen de la implementación interna de estos módulos ni de que importen `logger`.
  - `git diff --stat` engaña un poco aquí: casi todo lo eliminado es ruido de `try/catch` y bloques comentados; la superficie exportada de cada módulo no cambió.
---
