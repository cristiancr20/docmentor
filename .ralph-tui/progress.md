# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Sesión en localStorage (frontend):** las claves `userData` (JSON), `jwtToken` (string plano), `userPermissions` y `strapiUserId` forman la sesión. Leer el usuario siempre con `getUserData()` y limpiar con `clearStoredSession()` de `src/utils/auth.utils.js`; no hacer `JSON.parse(localStorage.getItem("userData"))` a mano. `AuthContext` descarta y limpia la sesión si `userData` no es JSON válido.
- **Tests con localStorage:** `setupTests.js` carga `jest-localstorage-mock` (métodos `jest.fn()`), y CRA aplica `resetMocks: true`, así que `getItem` devuelve `undefined` en cada test. Para probar código que usa localStorage hay que respaldarlo en `beforeEach` con un `Map` vía `localStorage.getItem.mockImplementation(...)` (ver `src/context/__tests__/AuthContext.test.jsx`).
- **Quality gates del frontend:** `npm run typecheck`, `npx eslint 'src/**/*.{js,jsx}'`, `CI=true npx react-scripts test --watchAll=false`. El warning de `act()` en `NotificationBell` es preexistente.

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
