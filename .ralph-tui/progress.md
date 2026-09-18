# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Sesión en localStorage (frontend):** las claves `userData` (JSON), `jwtToken` (string plano), `userPermissions` y `strapiUserId` forman la sesión. Leer el usuario siempre con `getUserData()` y limpiar con `clearStoredSession()` de `src/utils/auth.utils.js`; no hacer `JSON.parse(localStorage.getItem("userData"))` a mano. `AuthContext` descarta y limpia la sesión si `userData` no es JSON válido.
- **Tests con localStorage:** `setupTests.js` carga `jest-localstorage-mock` (métodos `jest.fn()`), y CRA aplica `resetMocks: true`, así que `getItem` devuelve `undefined` en cada test. Para probar código que usa localStorage hay que respaldarlo en `beforeEach` con un `Map` vía `localStorage.getItem.mockImplementation(...)` (ver `src/context/__tests__/AuthContext.test.jsx`).
- **Quality gates del frontend:** `npm run typecheck`, `npx eslint 'src/**/*.{js,jsx}'`, `CI=true npx react-scripts test --watchAll=false`. El warning de `act()` en `NotificationBell` es preexistente.
- **Config del frontend:** la única variable de entorno es `REACT_APP_API_URL` (`src/core/config.js` exporta solo `API_URL`, con fallback a `http://localhost:1337`). Plantilla en `frontend/.env.example`. `src/k6/**` está excluido de eslint y es un script de k6 (usa `__ENV`), no código de la app.
- **Expiración de sesión (401):** `core/apiClient.js` exporta `AUTH_EXPIRED_EVENT` (`"auth:expired"`); su interceptor de respuesta llama a `clearStoredSession()` y hace `window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))` en cualquier 401 que no sea de `/api/auth/local*`. `AuthContext` escucha ese evento y pone `user` en `null`, y `ProtectedRoute` (App.js) redirige a `/login`. Cualquier otro estado que deba reaccionar a la caducidad debe escuchar el mismo evento, no duplicar la lógica.
- **Tests de apiClient sin red:** axios está en `transformIgnorePatterns` (se transpila en jest). Para probar interceptores se pasa un `adapter` por petición: `api.get(url, { adapter: (config) => Promise.reject(Object.assign(new Error(), { config, response: { status: 401, config, headers: {}, data: {} } })) })` (ver `src/context/__tests__/AuthContext.expired.test.jsx`). No hace falta `axios-mock-adapter`.
- **Policies globales del backend:** `backend/src/policies/{is-authenticated,has-permission}.js` se registran solas como `global::is-authenticated` y `global::has-permission` (loader de Strapi, sin tocar `src/index.js`). En una ruta: `config: { auth: false, policies: ['global::is-authenticated', { name: 'global::has-permission', config: { code: 'projects.create' } }] }`. `is-authenticated` verifica el JWT (HS256, secret de users-permissions), carga el usuario con `populate: { rols: { populate: { permissions: true } } }` en una sola `findOne` y lo deja en `ctx.state.user`; `has-permission` solo lee `ctx.state.user.rols[].permissions[]` (no consulta la BD). Devuelven `false` → Strapi responde 403 `PolicyError`; nunca lanzan ni escriben `ctx.body`.
- **Tests del backend (jest + Strapi real):** la suite es un único `config/env/test/app.test.js` que hace `require` de cada carpeta; un test nuevo se añade creando `config/env/test/<tema>/index.js` y registrándolo ahí. `strapi` es global tras `setupStrapi()`. Para probar policies se llama a `strapi.policy('global::x')(ctx, config, { strapi })` con un ctx mínimo `{ request: { headers: { authorization } }, state: {} }`; los tokens se emiten con `strapi.plugins['users-permissions'].services.jwt.issue({ id }, { expiresIn })`. Las relaciones se crean con `strapi.db.query(uid).create({ data: { rols: [rol.id] } })`. Requiere Node 20 (`~/.nvm/versions/node/v20.20.2`; `engines` limita a <=20) y `npm ci` en `backend/` (no hay `node_modules` versionado).

---


## 2026-09-17 - US-001
- Se eliminó el cifrado AES "simulado" de la sesión: `userData` se guarda con `JSON.stringify` y `jwtToken` como string plano. `AuthContext` rehidrata con `getUserData()` (JSON.parse en try/catch) y, si el valor guardado no es JSON válido (sesión antigua cifrada), borra `userData`, `jwtToken`, `userPermissions` y `strapiUserId` sin ruido en consola.
- `apiClient.getAuthToken` devuelve `localStorage.getItem("jwtToken") || null`.
- `auth.utils.js`: se eliminaron `saveUserData` y `USER_STORAGE_KEYS` (sin llamadores); `getUserData` pasa a JSON plano y se añaden `SESSION_STORAGE_KEYS` / `clearStoredSession` (también usados por `logout`).
- Los 7 consumidores que llamaban a `decryptData` directamente (EditProject, NewProject, TutorDashboard, ProjectsAsignedTutor, ViewProjectsStudents, StudentDashboard, DocumentViewer) ahora usan `getUserData()`.
- `SECRET_KEY` eliminada de `core/config.js`; no existe `.env.example`, se quitó `REACT_APP_SECRET_KEY` del `.env` local (ignorado por git). `crypto-js` se mantiene por el SHA256 de `GeneratePdfButton.jsx`.
- Nuevo test `src/context/__tests__/AuthContext.test.jsx` (login/logout, recarga, migración de sesión cifrada).
- Files changed: `frontend/src/context/AuthContext.js`, `frontend/src/core/apiClient.js`, `frontend/src/core/config.js`, `frontend/src/utils/auth.utils.js`, `frontend/src/utils/encryption.js` (eliminado), `frontend/src/components/{EditProject,NewProject}.jsx`, `frontend/src/pages/{TutorDashboard,ProjectsAsignedTutor,ViewProjectsStudents,StudentDashboard,DocumentViewer}.jsx`, `frontend/src/context/__tests__/AuthContext.test.jsx` (nuevo).
- **Learnings:**
  - El PRD solo nombraba AuthContext/apiClient/auth.utils, pero había 7 páginas/componentes más leyendo `userData` cifrado por su cuenta; siempre `grep -rn decryptData` antes de dar por cerrado un cambio de almacenamiento.
  - `jest-localstorage-mock` + `resetMocks` de CRA deja `localStorage` inservible en los tests salvo que se le dé implementación en `beforeEach` (ver patrón arriba).
  - El ciphertext viejo de CryptoJS empieza por `U2FsdGVkX1` (base64 de `Salted__`) y nunca es JSON válido, así que `JSON.parse` en try/catch basta como detector de sesión antigua.
---

## 2026-09-17 - US-002
- Se eliminó el flujo de login institucional Keycloak/Aerobase muerto: `src/pages/LoginInstitucional.jsx` (borrado), `loginInstitutional` de `AuthContext` (función y valor del provider), y `getRoles`, `syncUserWithStrapi` y `assignRolesToStrapiUser` de `core/Autentication.js` (solo los usaba ese flujo; se conservan `registerUser`, `login`, `getUserWithRole`, `getUserByEmail`).
- `App.js`: se quitó el import y la ruta `/login-institucional` (el PRD decía que no estaba enrutada, pero sí lo estaba; ninguna otra página enlazaba a ella).
- `npm uninstall jwt-decode`: era la única importación (`Autentication.js`), ya no queda en `package.json` ni en `package-lock.json`.
- No queda ninguna referencia a `keycloak`, `aerobase`, `realm_access` ni `localhost:8080` en `frontend/src`.
- Files changed: `frontend/src/pages/LoginInstitucional.jsx` (eliminado), `frontend/src/App.js`, `frontend/src/context/AuthContext.js`, `frontend/src/core/Autentication.js`, `frontend/package.json`, `frontend/package-lock.json`.
- **Learnings:**
  - No fiarse de "no está enrutado" en el PRD: `grep -rn NombreComponente src` antes de borrar un archivo, porque `App.js` sí lo importaba y hubiera roto el build.
  - Los consumidores de `core/Autentication.js` son solo `Login.jsx`, `SignUp.jsx` y `DocumentViewer.jsx`; el login local depende de `login` + `getUserWithRole` + `useAuth().login`.
  - `isInstitutional` sigue usándose como flag de datos (`getTutors`, `NewProject`, `SignUp`, `Login`), así que no forma parte del código muerto de Keycloak y no hay que tocarlo.
---

## 2026-09-17 - US-003
- `core/config.js` queda reducido a `export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1337'`: se quitó el fallback a `docmentor-production.up.railway.app`, `WORKER_URL` (ningún archivo lo importaba) y el bloque `if (!API_URL) console.error(...)` que el fallback hacía inalcanzable.
- `src/k6/tests_load_k6.js`: la única otra referencia a railway era el `BASE_URL` hardcodeado del script de carga; ahora es `__ENV.BASE_URL || 'http://localhost:1337'` (se sobreescribe con `k6 run -e BASE_URL=...`).
- Nuevo `frontend/.env.example` con `REACT_APP_API_URL=http://localhost:1337`; el paso 4 de instalación del `README.md` raíz ahora dice `cp .env.example .env` y aclara que sin `.env` se usa ese mismo valor.
- `grep -rn railway frontend/src` no devuelve nada.
- Files changed: `frontend/src/core/config.js`, `frontend/src/k6/tests_load_k6.js`, `frontend/.env.example` (nuevo), `README.md`.
- **Learnings:**
  - `frontend/.env` está en `.gitignore` pero `.env.example` no, así que la plantilla sí se versiona.
  - El PRD hablaba de "frontend/src", que incluye `src/k6/`; aunque eslint lo ignora, el criterio de "cero referencias a railway.app" lo cubre, por eso se parametrizó en vez de dejarlo.
---

## 2026-09-17 - US-004
- `auth.utils.js` se limpió de helpers muertos/defectuosos: se eliminaron `ROLE_PRIORITY` y `getPrimaryRole` (nadie los importaba; además no contemplaban `coordinador`, el comparador devolvía `NaN` y `sort` mutaba el array de entrada). `USER_STORAGE_KEYS` y `saveUserData` ya habían sido eliminados en US-001, así que no hubo que tocarlos.
- Se conservan `ROLE_ROUTES` (App.js, Login.jsx), `validateAuthResponse` (Login.jsx), `getUserData` (AuthContext + 7 páginas/componentes) y `SESSION_STORAGE_KEYS` / `clearStoredSession` (AuthContext).
- Nuevo test `src/utils/__tests__/auth.utils.test.js`: verifica que `ROLE_ROUTES` tiene exactamente las claves `tutor`, `superadmin`, `estudiante`, `coordinador` y que cada valor es un path `/<area>/dashboard`.
- Files changed: `frontend/src/utils/auth.utils.js`, `frontend/src/utils/__tests__/auth.utils.test.js` (nuevo).
- **Learnings:**
  - Antes de eliminar una exportación, `grep -rnE "nombre1|nombre2" frontend/src` (sin `--include`, que en zsh hay que entrecomillar o falla con "no matches found"); la lista de exportaciones vivas de `auth.utils.js` queda arriba para futuras limpiezas.
  - Los tests de `src/utils/__tests__` que no tocan `localStorage` no necesitan el `mockImplementation` del patrón de AuthContext.
---

## 2026-09-17 - US-005
- `core/apiClient.js`: en un 401 (fuera de los endpoints públicos de login/registro) el interceptor ahora usa `clearStoredSession()` en vez de los cuatro `removeItem` a mano y después emite `window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))`. Se exporta `AUTH_EXPIRED_EVENT = "auth:expired"` para que provider y tests compartan el nombre.
- `context/AuthContext.js`: nuevo `useEffect` que registra `window.addEventListener(AUTH_EXPIRED_EVENT, () => setUser(null))` con cleanup en `removeEventListener`. Con `user` en `null`, el `ProtectedRoute` existente de `App.js` (`if (!user) return <Navigate to="/login" replace />`) redirige sin cambios.
- Nuevo test `src/context/__tests__/AuthContext.expired.test.jsx` (5 casos): un 401 limpia localStorage y emite el evento; un 401 del propio `/api/auth/local` no lo emite; un 500 no toca la sesión; `AuthProvider` deja `user` en `null` al recibir el 401; el listener se retira al desmontar.
- Files changed: `frontend/src/core/apiClient.js`, `frontend/src/context/AuthContext.js`, `frontend/src/context/__tests__/AuthContext.expired.test.jsx` (nuevo).
- **Learnings:**
  - `auth.utils.js` no importa nada, así que `apiClient` puede importar `clearStoredSession` sin ciclo; `AuthContext` importa de `apiClient` y `apiClient` de `auth.utils`, sin volver a `AuthContext`.
  - Para disparar un 401 real a través de los interceptores de axios en jest basta con pasar `adapter` en la config de la petición; axios reenvía el rechazo por `interceptors.response` como en producción (patrón añadido arriba).
  - Al comprobar el efecto del evento sobre el provider hay que envolver la petición en `await act(async () => ...)` para que React aplique el `setUser(null)` antes del `expect`.
---

## 2026-09-17 - US-006
- Nuevas policies globales en `backend/src/policies/`: `is-authenticated.js` (Bearer JWT verificado con `jsonwebtoken` + `algorithms: ['HS256']` y el `jwtSecret` de users-permissions; una sola `strapi.db.query('plugin::users-permissions.user').findOne` con `populate: { rols: { populate: { permissions: true } } }`; rechaza cuenta inexistente, `blocked` o `isActive === false`; deja el usuario completo en `ctx.state.user`) y `has-permission.js` (lee `config.code` y busca en `ctx.state.user.rols[].permissions[]` un permiso `isActive === true` con ese `code`; `false` si no hay usuario o falta `config.code`). Ambas devuelven `true`/`false` y capturan cualquier excepción devolviendo `false`.
- `utils/protectedController.js` queda intacto; ningún controller se migró todavía (eso corresponde a las historias siguientes).
- Tests nuevos en `config/env/test/policies/index.js` (16 casos: sin token, esquema no Bearer, token no-JWT, firmado con otro secret, expirado, usuario borrado, bloqueado, inactivo, éxito con `rols.permissions` cargados; has-permission sin usuario, sin `config.code`, sin rol, permiso ausente, permiso inactivo, permiso presente) registrados en `config/env/test/app.test.js`. `npm test`: 32/32.
- `backend/package.json` sin cambios (versiones de `@strapi/*` intactas).
- Files changed: `backend/src/policies/is-authenticated.js` (nuevo), `backend/src/policies/has-permission.js` (nuevo), `backend/config/env/test/policies/index.js` (nuevo), `backend/config/env/test/app.test.js`.
- **Learnings:**
  - El middleware de rutas de Strapi (`dist/services/server/policy.js`) acepta `true` o `undefined` como "pasa" y lanza `PolicyError` (403) con cualquier otro valor; el `policyContext` es un `Object.assign({ is, type }, ctx)` superficial, así que `policyContext.state` es el mismo objeto que `ctx.state` y asignar `policyContext.state.user` sí llega al controller.
  - `jsonwebtoken` no es dependencia directa de `backend/package.json`; se resuelve porque `@strapi/plugin-users-permissions` lo iza a `node_modules/jsonwebtoken` (v9). `protectedController.js` ya dependía de eso; si algún día se deshoista habría que declararlo.
  - `has-permission` no comprueba `rol.isActive` (igual que el `authorize()` actual, y el criterio solo habla del `isActive` del permiso); si se quiere exigir roles activos es un cambio de comportamiento a decidir aparte.
  - `strapi.db.query(...).create` con `blocked: true` o `isActive: false` funciona directo para fabricar usuarios de prueba; el `services.jwt.issue` del plugin acepta `{ expiresIn: -60 }` para generar tokens ya caducados.
  - Los warnings `Missing credentials for "PLAIN"` (nodemailer) y `next_version ... inversedBy` en la salida de `npm test` son preexistentes y no afectan al resultado.
---
