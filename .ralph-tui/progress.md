# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Notificaciones secundarias que nunca rompen el flujo principal:** el servicio `api::notification.notification` expone `notifyUser` / `notifyUsers` que envuelven todo en try/catch y devuelven `null` ante error. Los controllers (document/comment) llaman `notifyDocumentUploaded` / `notifyDocumentStatusChanged` / `notifyCommentReceived` DESPUÉS de la operación core y su auditoría. Nunca hacer que una notificación falle la request.
- **Rutas custom antes que core en Strapi:** en `routes/*.js` las rutas personalizadas (`/notifications/me`, `/notifications/:id/read`) van ANTES de `...createCoreRouter(...).routes` para que `/me` no sea capturado por `/:id`. Usan `config: { auth: false }` y autentican manualmente con `authenticate(ctx, strapi)` del `utils/protectedController`.
- **Preferencia por usuario vía enum en schema del user:** `notificationPreference` (`email` | `in_app` | `both`, default `both`) vive en `extensions/users-permissions/content-types/user/schema.json`. El servicio respeta la preferencia al decidir entre crear notificación in-app y/o enviar email (`transporter` de `src/mailer/mailer`).
- **Frontend polling + JWT desencriptado:** `core/Notification.js` desencripta el `jwtToken` de localStorage con `decryptData` y arma `Authorization: Bearer`. `NotificationBell.jsx` hace polling cada `POLL_INTERVAL_MS` (30s) con `setInterval` limpiado en el cleanup del `useEffect`.
- **Generación de PDF en cliente con jsPDF + hash de integridad:** `components/GeneratePdfButton.jsx` arma el reporte con `jsPDF` + `autoTable` (tablas de documentos y comentarios de tutores). Los logos se insertan con el 8º arg de `addImage` (`compression: "MEDIUM"`) para optimizar tamaño. El hash de integridad es `CryptoJS.SHA256(JSON.stringify(contenidoCanónico)).toString()`, se muestra en el pie y se guarda en `doc.setProperties({ keywords: 'integridad:<hash>' })`. Los comentarios de tutores vienen poblados en `documents[].attributes.comments.data` (via `getDocumentsByProjectId` con `populate=*`), NO en `project.attributes.documents` (populate de 1 nivel no anida comments). Se pasan `documents` y `generatedBy` como props separadas.

---


## 2026-07-12 - US-015
- Verificado e implementado el Sistema de Notificaciones en Tiempo Real (polling cada 30s como tecnología elegida). El grueso quedó de una iteración previa; esta iteración lo verificó contra los acceptance criteria y confirmó que todo pasa.
- **Backend:**
  - `api/notification/content-types/notification/schema.json`: content-type con `tutor` (destinatario), `message`, `isRead`, `type` (enum: document_uploaded/status_changed/comment_received/general), `documents` (m:n).
  - `api/notification/services/notification.js`: `notifyUser`/`notifyUsers` (respeta preferencia, nunca lanza), `notifyDocumentUploaded`, `notifyDocumentStatusChanged`, `notifyCommentReceived`, `getMyNotifications` (30 días, límite 100), `cleanupOldNotifications` (retención 30 días), envío de email vía `transporter`.
  - `api/notification/controllers/notification.js`: `findMine`, `markRead` (valida ownership), `markAllRead`, `getPreferences`, `updatePreferences` (valida email/in_app/both).
  - `api/notification/routes/notification.js`: rutas custom `/notifications/me`, `/me/read-all`, `/me/preferences` (GET/PUT), `/:id/read` antes de las rutas core.
  - Triggers en `api/document/controllers/document.js` (create → notifyDocumentUploaded, changeStatus → notifyDocumentStatusChanged) y `api/comment/controllers/comment.js` (create → notifyCommentReceived).
  - `extensions/users-permissions/content-types/user/schema.json`: campo `notificationPreference` (enum, default `both`).
- **Frontend:**
  - `core/Notification.js`: cliente axios con JWT desencriptado para los 5 endpoints.
  - `components/NotificationBell.jsx`: bell con badge de no leídas, dropdown con lista/tipo/fecha, marcar-una/marcar-todas, selector de preferencia, polling 30s.
  - `components/Navbar.jsx`: `<NotificationBell />` montado para cualquier usuario autenticado.
  - `components/__tests__/NotificationBell.test.jsx`: 6 tests (pasan).
- **Quality checks:** frontend `npm run lint` (eslint) y `npm run typecheck` (tsc --noEmit) pasan sin errores; backend lint/typecheck son no-ops configurados. Tests de NotificationBell: 6/6 pasan.
- **Learnings:**
  - Los tests muestran un warning `act(...)` benigno por el `setPreference` async en `useEffect`; no falla la suite. No requirió cambio.
  - El backend no tiene ESLint/tsc reales (scripts hacen `echo`), así que el gating de calidad efectivo está en el frontend.
  - Patrón de Strapi: rutas custom deben preceder a `createCoreRouter().routes` para no colisionar con `/:id`.
---

## 2026-07-12 - US-016
- Exportar Reporte de Proyecto a PDF. Se reescribió el `GeneratePdfButton` (antes "Generar Informe de revisión", solo tutores) para cumplir todos los acceptance criteria y quedar disponible para estudiantes y tutores.
- **Frontend:**
  - `components/GeneratePdfButton.jsx`: botón "Descargar PDF". Genera PDF profesional con encabezado y logos de la universidad (compresión `MEDIUM` para optimizar tamaño, <10MB), título/descripción/itinerario/fechas/tutor/estudiantes, tabla de documentos con sus estados (Revisado/Pendiente) y versión, tabla de comentarios de tutores por documento, y bloque de metadatos (fecha de generación, generado por, hash de integridad SHA-256). Hash también embebido en `doc.setProperties({ keywords })`. Props: `project`, `documents` (con comments poblados), `generatedBy`.
  - `pages/ProyectoDetalle.jsx`: usa `useAuth` para `generatedBy`; renderiza el botón para `canReviewDocuments || canUploadDocuments` (tutores y estudiantes) pasándole `documents` (que ya trae comments via `getDocumentsByProjectId` populate=*) y `generatedBy`.
  - `components/__tests__/GeneratePdfButton.test.jsx`: 4 tests (render del botón, nombre de archivo, hash de integridad en metadatos, sin documentos/comentarios). Pasan.
- **Quality checks:** `npm run lint` (0), `npm run typecheck` (0), suite completa 25/25 tests en 7 suites.
- **Learnings:**
  - `react-scripts` activa `resetMocks: true` por defecto: hay que (re)asignar `jsPDF.mockImplementation(...)` en `beforeEach`, no en una var de módulo, o `new jsPDF()` devuelve `{}` y falla `doc.setProperties`.
  - Los factories de `jest.mock(...)` no pueden referenciar vars fuera de scope salvo que tengan prefijo `mock` (case-insensitive).
  - Los `.png` importados por un componente bajo test se mockean con `jest.mock("../../assets/x.png", () => "x.png")` para evitar el transform de binarios.
  - Los comentarios de tutores están en `documents[].attributes.comments.data`, no en `project.attributes.documents` (populate `*` de Strapi es de 1 solo nivel).
---
