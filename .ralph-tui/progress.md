# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Logging en frontend**: nunca usar `console.*` directamente en `frontend/src`. Importar `logger` desde `utils/logger` (`import logger from "../utils/logger"`) y usar `logger.debug/info/warn/error`. `debug`/`info` se silencian con `NODE_ENV === 'production'`; `warn`/`error` siempre salen. La comprobación de entorno es por llamada, así que los tests pueden alternar `process.env.NODE_ENV` sin `jest.resetModules()`.
- **Estilo de comillas en frontend**: `src/core/*.js` usa comillas simples en imports; `src/components`, `src/pages`, `src/context` usan dobles. Al añadir imports, respetar el estilo del archivo.
- **Grep en zsh**: `--include=*.js` sin comillas falla con "no matches found"; usar `--include='*.js'`.
- **Errores en `core/*.js`**: las funciones son llamadas directas a `apiClient` (`return (await api.get(...)).data`), sin `try/catch` que solo loguee y relance: el interceptor de `apiClient` ya centraliza los errores y quien los maneja es la página/componente. Solo se envuelve en `try/catch` cuando el catch hace algo propio (devolver `null`/`[]`, tragar el error). Tampoco se pasa `Content-Type: application/json` a mano; axios lo pone solo con cuerpos de objeto (el `multipart/form-data` de `uploadFile` sí se mantiene).

- **Logging en backend**: en `backend/src` nunca usar `console.*`; usar `strapi.log.info/warn/error/debug` (global de Strapi, disponible también en callbacks asíncronos de módulos cargados por Strapi como `mailer.js`). Excepciones: `backend/scripts/*` (CLI, sí usan `console`) y `src/admin/app.example.js` (código de navegador del panel admin, sin `strapi`; no loguear ahí).
- **Tests del backend**: `backend/package.json` exige `node >=18 <=20`; con Node 26 (el default de la máquina) `npm test` revienta en `buffer-equal-constant-time` (`SlowBuffer`) antes de ejecutar nada. Correr con `PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" npm test`.
- **Peticiones cancelables en polling**: las funciones de `core/*.js` que se usan en polling aceptan `{ signal }` opcional y lo pasan a axios como `config.signal`. En el componente, un `AbortController` por ciclo dentro del `useEffect`, abortado en el cleanup junto con `clearInterval`, y en el `catch` se ignoran los errores con `name === "CanceledError"` (axios) o `"AbortError"` (fetch nativo) antes de loguear. Ver `NotificationBell.jsx`.
- **Carga de proyectos en dashboards**: usar `useProjects(loader, deps)` de `frontend/src/hooks/useProjects.js` en vez de repetir el trío `projects/loading/error` + `useEffect`. `loader({ signal })` es async y devuelve la lista de proyectos; puede cargar datos derivados por el camino (documentos, métricas) y `loading` queda en `true` hasta que termina. El hook guarda el `Error` completo (renderizar `error.message`), loguea con `logger.error`, aborta/descarta la carga en el cleanup y expone `reload()` y `setProjects` (para actualizaciones locales sin refetch, p.ej. asignar tutor en `CoordinatorDashboard`). El loader se lee vía `useRef`, así que no hace falta `useCallback`; la carga solo se relanza con `deps` o `reload()`.
- **Tests con `jest.useFakeTimers()` y RTL**: envolver el `render` en `await act(async () => {...})` para que las promesas ya resueltas de los mocks (p.ej. `getNotificationPreference`) se apliquen dentro de `act` y no salte el warning "not wrapped in act"; `waitFor` no funciona bien con fake timers, así que hay que avanzar el reloj con `jest.advanceTimersByTime` dentro de `act`.

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

## 2026-09-17 - US-003
- `backend/src/mailer/mailer.js`: los dos `console.log` del `transporter.verify` pasan a `strapi.log.error` (fallo SMTP) y `strapi.log.info` (servidor listo).
- `backend/src/admin/app.example.js`: se quitó el `console.log(app)` del `bootstrap` de ejemplo (código de navegador del panel admin; no aplica `strapi.log`), dejando el cuerpo vacío con un comentario.
- Borrados `backend/src/api/document/content-types/document/lifecycles.js` y `backend/src/api/project/content-types/project/lifecycles.js`: ambos archivos estaban comentados de arriba abajo (`/* ... */`), así que no había código activo que migrar. Las plantillas HTML vecinas se dejan tal cual.
- `backend/scripts/seed-test-users.js` se conserva con `console.*` (script CLI).
- Verificado: `grep -rn 'console\.' backend/src` vacío; `backend/package.json` sin cambios; `npm test` (Node 20) → 90 tests pasan.
- Files changed: `backend/src/mailer/mailer.js`, `backend/src/admin/app.example.js`; eliminados los dos `lifecycles.js`.
- **Learnings:**
  - De los 27 `console.*` de la historia, 23 vivían en los dos `lifecycles.js` comentados (código muerto que además tenía errores de sintaxis, p.ej. `'api::setting.setting)` sin cerrar la comilla); el envío de correos real vive en `api/notification/services/notification.js`, que ya usaba `strapi.log`.
  - `strapi` es global y está disponible dentro de callbacks asíncronos de módulos que Strapi carga (el `verify` del transporter en `mailer.js` ya se ve en la salida de los tests como `[error]: Error al verificar la conexión SMTP: Missing credentials for "PLAIN"`).
  - En zsh, `echo =====` falla con "not found" (expansión `=cmd`) y aborta toda la línea; usar `echo "====="`.
  - `npm test` con Node 26 falla antes de ejecutar suites (`buffer-equal-constant-time` usa `SlowBuffer`, eliminado en Node ≥24); hay que usar Node 20 de nvm.
---

## 2026-09-17 - US-004
- `frontend/src/core/Notification.js`: `getMyNotifications({ signal } = {})` pasa `signal` a `api.get` como `config.signal`. El resto de funciones no cambia.
- `frontend/src/components/NotificationBell.jsx`: `loadNotifications(signal)` ignora los errores `CanceledError`/`AbortError` antes de loguear; el `useEffect` de polling crea un `AbortController` por ciclo (`poll()`), aborta el anterior al lanzar el siguiente y en el cleanup hace `clearInterval` + `controller.abort()`. `POLL_INTERVAL_MS` sigue en 30000.
- `frontend/src/components/__tests__/NotificationBell.test.jsx`: dos tests nuevos. (1) mock de `getMyNotifications` que queda pendiente hasta que se aborta el signal (rechaza con `CanceledError`, como axios), `unmount()` durante la petición, y se comprueba `signal.aborted === true` y que `console.error` no se llamó (ni warnings de React ni `logger.error`). (2) con fake timers, avanzar `POLL_INTERVAL_MS` aborta el signal del ciclo anterior y crea uno nuevo.
- Verificado: `npm run typecheck`, `npx eslint 'src/**/*.{js,jsx}'` y `CI=true npx react-scripts test --watchAll=false` (12 suites, 66 tests) pasan.
- Files changed: `frontend/src/core/Notification.js`, `frontend/src/components/NotificationBell.jsx`, `frontend/src/components/__tests__/NotificationBell.test.jsx`.
- **Learnings:**
  - React 18 ya no emite el warning "Can't perform a React state update on an unmounted component", así que el test lo cubre espiando `console.error` en general (atrapa también un `logger.error` indebido si el `CanceledError` no se ignorase) y comprobando directamente `signal.aborted`.
  - El test preexistente "muestra mensaje vacío cuando no hay notificaciones" ya emitía un warning "not wrapped in act" (por `setPreference` tras resolver `getNotificationPreference`) antes de esta historia; no se tocó porque queda fuera del alcance.
  - `echo ====` en zsh falla con "=== not found" (expansión `=cmd`); usar otro separador en los scripts de shell.
---

## 2026-09-17 - US-005
- Creado `frontend/src/hooks/useProjects.js`: `useProjects(loader, deps = [])` devuelve `{ projects, loading, error, reload, setProjects }`. Un `AbortController` por carga, abortado en el cleanup del `useEffect` (desmontaje, cambio de `deps` o `reload()`); tras abortar se descarta el resultado y no se hace `setState`. Los errores `CanceledError`/`AbortError` se ignoran; el resto se loguea con `logger.error("Error fetching dashboard data:", err)` (mismo mensaje que tenían los dashboards) y se guarda el objeto `Error`.
- `StudentDashboard.jsx`, `TutorDashboard.jsx` y `CoordinatorDashboard.jsx`: eliminados los `useState` de `projects`, `loading` y `error`, el `useEffect` de montaje y el `try/catch/finally` de `fetchDashboardData`; la función ahora devuelve la lista de proyectos y se pasa a `useProjects`. Student/Tutor devuelven `[]` si no hay `userEmail` (antes el `if` dejaba `projects` vacío y `loading` en false: mismo resultado). Se quitó el import de `logger` en Student/Tutor (ya no lo usaban); Coordinator lo conserva para `calculateMetrics`/`handleAssignTutor` y usa el `setProjects` del hook para la actualización local tras asignar tutor.
- El banner de error renderiza `{error.message}` (antes el estado guardaba `err.message`). Spinner (`SkeletonStats`/`SkeletonRows`) mientras `loading`, banner cuando `error`, lista cuando hay datos: sin cambios en el JSX.
- Añadido `frontend/src/hooks/__tests__/useProjects.test.js` (7 tests con `renderHook`): carga correcta, loader que devuelve `undefined`, error, `reload`, cambio de `deps`, abort al desmontar (comprueba `signal.aborted` y que no hay `console.error`) y `CanceledError` ignorado.
- Verificado: `npm run typecheck`, `npx eslint 'src/**/*.{js,jsx}'` y `CI=true npx react-scripts test --watchAll=false` (13 suites, 73 tests) pasan.
- Files changed: `frontend/src/hooks/useProjects.js` (nuevo), `frontend/src/hooks/__tests__/useProjects.test.js` (nuevo), `frontend/src/pages/{StudentDashboard,TutorDashboard,CoordinatorDashboard}.jsx`.
- **Learnings:**
  - El "loader" de los dashboards no es una simple llamada a core: tras traer los proyectos carga documentos/métricas y el skeleton debe seguir hasta que todo termina. Por eso el hook acepta cualquier función async que *devuelva* proyectos y no fija la llamada a core; los datos derivados se siguen guardando con setters propios del dashboard.
  - `CoordinatorDashboard.handleAssignTutor` hacía `setProjects(updatedProjects)` para una actualización optimista local; usar `reload()` ahí habría vuelto a mostrar el skeleton y refetch de todo, así que el hook expone también `setProjects`.
  - Diferencia menor asumida: antes, si fallaba `getDocumentsByProjectId` después de `setProjects(...)`, quedaban los proyectos visibles junto al banner de error; ahora `projects` queda `[]` porque el loader no llegó a devolverlos.
  - `eslint.config.mjs` no incluye `eslint-plugin-react-hooks`, así que `useEffect(..., [...deps, reloadToken])` no genera ningún aviso de `exhaustive-deps`.
  - `renderHook` de `@testing-library/react` v15 + `waitFor` sobre `result.current.loading` es suficiente para probar hooks async; para el caso de desmontaje hay que resolver la promesa pendiente dentro de `act(async ...)` y comprobar que `console.error` no se llamó.
---
