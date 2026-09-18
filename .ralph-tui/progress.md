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
- **`populate` en `core/*.js`**: nunca `populate=*` en listas. Se piden solo las relaciones que lee el consumidor, como `params` de axios con la sintaxis de Strapi: `"populate[relacion][fields][0]": "campo"` (o `"populate[relacion]": true`). Si una función de lista tiene consumidores con necesidades distintas, el default es sin relaciones y el que las necesita pasa una opción (`getDocumentsByProjectId(id, { withRelations: true })` en `ProyectoDetalle`). Las llamadas `findOne` que alimentan el visor (`getDocumentById`) sí mantienen `populate=*`. Para comprobar una consulta nueva contra datos reales: `require('@strapi/strapi')().load()` + `server.mount()` + supertest desde `backend/` (ver US-006), porque `strapi develop` no arranca en esta máquina.
- **Tests con `jest.useFakeTimers()` y RTL**: envolver el `render` en `await act(async () => {...})` para que las promesas ya resueltas de los mocks (p.ej. `getNotificationPreference`) se apliquen dentro de `act` y no salte el warning "not wrapped in act"; `waitFor` no funciona bien con fake timers, así que hay que avanzar el reloj con `jest.advanceTimersByTime` dentro de `act`.
- **Hooks de orquestación para componentes grandes**: cuando un componente mezcla mucho `useState/useEffect` con JSX, mover el estado a `frontend/src/hooks/useX.js` que recibe las entradas ya resueltas (p.ej. `useDocumentCompare(doc1, doc2)`, no `documents + currentIndex`) y devuelve un objeto plano con estado derivado ya calculado (`loading`, `error`, `hasResult`, `panes` con las notas mezcladas, manejadores con `useCallback`). El componente solo desestructura y pinta. Tests con `renderHook` + `initialProps`/`rerender` para simular el cambio de entradas, mockeando los módulos de `core/` y `utils/` que use el hook (y `core/config.js` para fijar `API_URL`). Ver `useDocumentCompare` y su test.
- **Build del backend en esta máquina (arm64)**: `backend/package-lock.json` solo pinea `@swc/core-linux-x64-gnu` (se generó en Linux), así que `npm install`/`npm ci` en un Mac arm64 no instala el binding darwin y `strapi build`/`strapi develop` mueren con `Failed to load native binding` (`./swc.darwin-universal.node`). Para verificar `npm run build` sin tocar el lockfile: `npm pack @swc/core-darwin-arm64@<versión de @swc/core en el lockfile>` en `/tmp`, extraer y copiar `package/` a `backend/node_modules/@swc/core-darwin-arm64/`; después borrar esa carpeta para que `node_modules` vuelva a coincidir con el lockfile. El build tarda ~10 s.
- **`npm uninstall` en backend y el diff del lockfile**: con Node 20 (`PATH` de nvm) y `--no-audit --no-fund` el lockfile solo pierde entradas. `git diff | grep '^+.*"version"'` puede dar falsos positivos por la alineación del algoritmo Myers (un bloque idéntico aparece como borrado y reañadido); comprobar con `git diff --diff-algorithm=patience`, que devuelve 0 si de verdad no cambia ninguna versión.

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

## 2026-09-17 - US-006
- `frontend/src/core/Document.js`: `getDocumentsByProjectId(projectId, { withRelations = false })` deja de pedir `populate=*`. Por defecto no pobla ninguna relación (dashboards Student/Tutor/Coordinator y el selector de versiones de `DocumentViewer` solo leen `title/status/version/createdAt` e `id`). Con `withRelations: true` (solo `ProyectoDetalle`) añade `PROJECT_DOCUMENTS_RELATIONS`: `documentFile[fields]=url` (comparador y línea de tiempo), `restoredFrom[fields]=version` (línea de tiempo) y `comments[fields]=correction,quote` (PDF del proyecto). `copyDocumentAsNewVersion` (sin consumidores) pide solo `fields[0]=id` de `project/documentFile/comments/notifications`. `getDocumentById` (visor) conserva `populate=*` tal y como exige la historia.
- `frontend/src/core/Projects.js`: `getProjectById` pide `populate[tutor|students][fields]=username,email` en lugar de `populate=*` (que arrastraba todos los documentos del proyecto). `ProyectoDetalle` y `GeneratePdfButton` solo muestran nombre y correo.
- `ProyectoDetalle.jsx` llama a `getDocumentsByProjectId(projectId, { withRelations: true })`; el comentario de `GeneratePdfButton.jsx` deja de hablar de `populate=*`.
- Nuevo `frontend/src/core/__tests__/populate.test.js` (4 tests) que fija los `params` exactos que envían ambas funciones.
- Notas por llamada (relaciones conservadas y consumidores) en `tasks/prd-calidad.json` → US-006 `notes`.
- Verificado: `npm run typecheck`, `npx eslint 'src/**/*.{js,jsx}'` y `CI=true npx react-scripts test --watchAll=false` (14 suites, 77 tests). Además, las cuatro consultas nuevas se lanzaron contra Strapi real con la base de desarrollo (`backend/.tmp/data.db`, proyecto "Finlycr" con 6 versiones, comentarios y una restauración) usando tokens de estudiante, tutor y coordinador: cada respuesta trae exactamente los campos que leen las páginas y los filtros de pertenencia siguen aplicando. Tamaño de la lista de documentos: 12.7 KB → 1.4 KB.
- Files changed: `frontend/src/core/{Document,Projects}.js`, `frontend/src/core/__tests__/populate.test.js` (nuevo), `frontend/src/pages/ProyectoDetalle.jsx`, `frontend/src/components/GeneratePdfButton.jsx`, `tasks/prd-calidad.json` (notes).
- **Learnings:**
  - `getDocumentsByProjectId` tiene cinco consumidores pero solo uno (`ProyectoDetalle`) lee relaciones; los dashboards la llaman una vez por proyecto, así que el default ligero es el que importa para el rendimiento. `DocumentViewer` la usa solo para navegar entre versiones hermanas (id + version).
  - En Strapi 4 REST sin `populate` la relación no viene en `attributes` (queda `undefined`), no `{ data: null }`; los consumidores que aún la leen usan `?.` así que no revientan, pero conviene que la relación esté en la lista de `withRelations`.
  - `populate[relacion][fields][0]=id` funciona: Strapi devuelve `{ id, attributes: {} }` por elemento. Con `users-permissions.user` (`tutor`, `students`) `fields=username,email` también funciona y el sanitizador no se queja.
  - `strapi develop` no arranca en esta máquina (`@swc/core` sin binding `darwin-universal`), pero `require('@strapi/strapi')().load()` + `server.mount()` + supertest (el mismo patrón de `backend/config/env/test/helpers/strapi.js`) sí, y sirve para probar consultas contra `.tmp/data.db` sin tocar datos. El script tiene que vivir dentro de `backend/` para que resuelva `node_modules`; se borró al terminar.
  - Por defecto, `find` de Strapi pagina a 25; `getDocumentsByProjectId` nunca ha fijado `pagination`, se deja igual (fuera del alcance).
---

## 2026-09-17 - US-007
- `git mv frontend/src/components/DisplayNotesSidebarExample.tsx frontend/src/components/PdfViewer.tsx`. Dentro del archivo, el componente interno se llamaba `HighlightExample` (no coincidía ni con el nombre del archivo); ahora es `const PdfViewer: React.FC<PdfViewerProps>` y `export default PdfViewer`. Sin cambios de lógica.
- `frontend/src/pages/DocumentViewer.jsx` y `frontend/src/components/DocumentComparePopup.jsx`: import y JSX pasan de `DisplayNotesSidebarExample` a `PdfViewer` (se mantiene la extensión `.tsx` explícita en el import, como estaba).
- Verificado: `grep -rn DisplayNotesSidebarExample frontend/src` vacío; `npm run typecheck`, `npx eslint 'src/**/*.{js,jsx}'` y `CI=true npx react-scripts test --watchAll=false` (14 suites, 77 tests) pasan.
- Files changed: `frontend/src/components/PdfViewer.tsx` (renombrado), `frontend/src/pages/DocumentViewer.jsx`, `frontend/src/components/DocumentComparePopup.jsx`.
- **Learnings:**
  - El nombre `DisplayNotesSidebarExample` solo aparecía en sus dos consumidores; no hay tests, docs ni configuración que lo referencien fuera de `frontend/src`.
  - Los imports desde `.jsx` hacia `.tsx` llevan la extensión explícita (`"./PdfViewer.tsx"`); `tsc --noEmit` y CRA lo aceptan, así que al renombrar hay que cambiar también la ruta con extensión.
  - En zsh, `${PIPESTATUS[0]}` no existe (es `$pipestatus[1]`); para capturar el exit code de un comando con `| tail`, mejor ejecutarlo sin pipe y leer `$?`.
---

## 2026-09-17 - US-008
- Creado `frontend/src/hooks/useDocumentCompare.js`: recibe `doc1`/`doc2` y encapsula todo lo que antes vivía en `DocumentComparePopup` (comparación con `comparePdfDocuments`, carga de comentarios, pestaña, filtro, página objetivo, sincronía de scroll, scroll al cambiar de pestaña). Expone `canCompare`, `panes` (título, versión, url, notas ya mezcladas con los resaltados del diff y `onScrollerReady`), `result`, `similarity`, `loading`, `error`, `hasResult`, `showDiffOverlay`, `hunks`, `visibleHunks`, `filter/setFilter`, `tab/setTab`, `targetPage`, `goToPage`, `syncScroll/setSyncScroll`, `runComparison`, `contentRef`.
- `DocumentComparePopup.jsx` pasa de 482 a 292 líneas (-39%): solo ordena los documentos, desestructura el hook y pinta. El array `tabs` sale del cuerpo del componente por ser constante.
- El hook sustituye el `status` de cuatro valores por `loading` + `error` (guarda el `Error`) y añade un contador `runIdRef` para descartar el resultado de una comparación anterior que termine tarde (antes, cambiar de par mientras cargaba podía pisar el resultado nuevo con el viejo).
- Añadido `frontend/src/hooks/__tests__/useDocumentCompare.test.js` (9 tests): resultado y similitud, descripción de paneles, mezcla de comentarios y resaltados, filtro y reset al cambiar de par, `goToPage`, error + reintento, sin capa de texto, sin archivo, descarte de resultado obsoleto.
- `frontend/src/utils/pdfCompare.js` sin cambios.
- Verificado: `npm run typecheck`, `npx eslint 'src/**/*.{js,jsx}'` y `CI=true npx react-scripts test --watchAll=false` (15 suites, 86 tests) pasan. La verificación manual en la app no se hizo en esta iteración (sesión no interactiva; `strapi develop` no arranca en esta máquina, ver US-006).
- Files changed: `frontend/src/hooks/useDocumentCompare.js` (nuevo), `frontend/src/hooks/__tests__/useDocumentCompare.test.js` (nuevo), `frontend/src/components/DocumentComparePopup.jsx`.
- **Learnings:**
  - `renderHook` con `initialProps` + `rerender({...})` es la forma limpia de probar el efecto "al cambiar de par se resetea el filtro y se relanza la comparación".
  - Para probar el descarte de resultados obsoletos basta con un `mockImplementationOnce` que devuelva una promesa cuyo `resolve` se guarda fuera y se dispara dentro de `act` después de que la segunda comparación haya terminado.
  - `API_URL` se lee de `process.env.REACT_APP_API_URL` en `core/config.js`; mockear el módulo (`jest.mock("../../core/config.js", () => ({ API_URL: "http://api.test" }))`) evita que el test dependa del `.env` local.
---

## 2026-09-17 - US-009
- `cd backend && npm uninstall sqlite3 --no-audit --no-fund` con Node 20: `sqlite3` desaparece de `devDependencies` en `backend/package.json` y el lockfile pierde 71 paquetes (`sqlite3`, `node-gyp`, `make-fetch-happen`, `cacache`, `minipass-*`, `npmlog`, `gauge`, `socks*`, etc.). Ninguna línea añadida cambia la versión de un paquete existente (comprobado con `git diff --diff-algorithm=patience backend/package-lock.json | grep '^+.*"version"'` → 0); las únicas líneas nuevas son dos `"peer": true` en `node_modules/encoding` y su `iconv-lite` anidado, que ahora solo se alcanzan como peer opcional de `node-fetch`. Todos los `@strapi/*` siguen en la misma versión (`@strapi/strapi ^4.25.17`, `plugin-email ^4.25.13`, `plugin-cloud|i18n|users-permissions ^4.12.0`).
- `grep -rn sqlite3 backend/src backend/config backend/scripts | grep -v better-sqlite3` vacío antes de tocar nada: el único uso era la propia devDependency. `better-sqlite3 ^11.0.0` se mantiene como driver de Strapi 4.
- Verificado: `npm run build` (con el binding `@swc/core-darwin-arm64` copiado a mano en `node_modules` y borrado después, ver patrón) y `npm test` (1 suite, 90 tests) pasan con Node 20.
- Files changed: `backend/package.json`, `backend/package-lock.json`.
- **Learnings:**
  - El `grep '^+.*"version"'` del criterio de aceptación devolvía 1 línea (`node_modules/is-absolute` 1.0.0) con el diff por defecto de git, pero era un artefacto de alineación: la entrada es idéntica antes y después. Con `--diff-algorithm=patience` da 0.
  - El lockfile del backend se generó en Linux x64 y solo trae `@swc/core-linux-x64-gnu`; eso, y no un problema del código, es por lo que `strapi build/develop` no arrancaban en esta máquina (US-006 y US-008 lo habían atribuido genéricamente a `@swc/core`).
---
