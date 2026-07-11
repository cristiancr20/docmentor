# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Strapi Content Types**: Use schema.json in `src/api/<entity>/content-types/<entity>/` to define collection types with required/unique constraints
- **Soft Delete Pattern**: Implement in controller by updating `isActive` field instead of removing records
- **Database Seeding**: Use bootstrap lifecycle hook in `src/index.js` with `strapi.db.lifecycles.subscribe()` to seed data on app startup
- **CRUD Routes**: Strapi's `createCoreRouter()` auto-generates GET, POST, PUT, DELETE endpoints for collection types
- **Custom Relation Endpoints**: For custom relation behavior, define routes in routes array with custom handler methods and use `entityService.update()` with `connect`/`disconnect` operations for many-to-many relations
- **Many-to-Many Relations**: Use `relation: "manyToMany"` with `inversedBy` to manage both sides automatically; use `mappedBy` only when one side should not manage the relation
- **File Export Pattern**: For PDF/XLSX exports, create routes array with custom handler, service method returns data + hash, controller uses format parameter to dispatch to appropriate generator, response includes Content-Type/Content-Disposition headers and optional X-[Resource]-Hash header for integrity verification

---

## [2026-07-11] - US-010

### Implementation
Refactored StudentDashboard into a personalized dashboard displaying active projects and recent documents with permission-based controls. Dashboard includes metrics for projects, documents, and documents pending review with visual status indicators.

### Files Changed
- `frontend/src/pages/StudentDashboard.jsx` - Refactored from welcome screen to full-featured dashboard with:
  - Active projects list with status badges
  - Recent documents table sorted by date
  - Three metrics cards: Projects Activos, Documentos Totales, En Revisión
  - Permission-gated buttons for Create Project and Upload Document (using PermissionGate component)
  - Status color coding: Creado/Subido (gray), En Revisión (blue), Aprobado (green), Rechazado/Cambios Solicitados (red)
  - Navigation links to My Projects and Document History
  - Responsive grid layout with Framer Motion animations
  - Loading state and error handling

### Learnings
- StudentDashboard uses the same data fetching patterns as other pages (getProjectsByStudents, getDocumentsByProjectId)
- Permission gates work seamlessly with PermissionContext from US-009 to conditionally render action buttons
- Status colors should map document status values (Subido, En Revisión, Aprobado, etc.) to visual badges
- Dashboard data requires fetching documents from multiple projects, sorting by date, and calculating metrics
- Navigation between dashboard and projects view uses React Router's useNavigate hook
- Recent documents should be sorted by createdAt descending and limited to first 5 for dashboard view
- The user object from AuthContext contains username which is used for personalized greeting

---

## [2026-07-11] - US-009

### Implementation
Created a dynamic permission context system that loads user permissions from the backend during login and provides hooks for checking permissions on the frontend.

### Files Changed
- `backend/src/extensions/users-permissions/controllers/User.js` - Added getMyPermissions method that fetches current user's role permissions and returns filtered permission codes
- `backend/src/extensions/users-permissions/routes/index.js` - Added GET /api/auth/me/permissions route
- `frontend/src/context/PermissionContext.js` - Created PermissionContext with usePermission hook, usePermissionCheck hook, and hasPermissions utility function
- `frontend/src/components/PermissionGate.js` - Created PermissionGate component for conditional rendering based on permissions
- `frontend/src/App.js` - Wrapped app with PermissionProvider to enable permission checking throughout the app
- `frontend/package.json` - Added typecheck script
- `frontend/tsconfig.json` - Created TypeScript configuration file

### Learnings
- Permission context loads permissions after user login by fetching from the backend endpoint
- Permissions are cached in localStorage for quick access across sessions
- Decryption of JWT token is required to use it in Authorization header for API calls
- Backend permissions endpoint uses JWT authentication via Bearer token in Authorization header
- PermissionGate component supports single permission checks, multiple permissions with OR logic (default), or AND logic via requireAll flag
- Frontend provides three ways to check permissions: usePermissionCheck hook for single permission, hasPermissions utility for multiple permissions, and PermissionGate component for UI rendering
- Permissions are fetched only when user is authenticated; unauthenticated users get empty permissions from localStorage cache

---

## [2026-07-11] - US-008

### Implementation
Implemented audit log export functionality supporting PDF and XLSX formats with digital signatures for integrity verification. Exports include filters by date range, user ID, and entity type.

### Files Changed
- `backend/src/api/audit/routes/audit.js` - Added GET /api/audit-logs/export custom route
- `backend/src/api/audit/services/audit.js` - Added exportAuditLogs method that retrieves filtered logs and generates SHA-256 hash
- `backend/src/api/audit/controllers/audit.js` - Added export method with permission validation and format handling
- `backend/src/utils/exportReports.js` - Created PDF and XLSX generation utilities using pdfkit and xlsx libraries
- `backend/package.json` - Added pdfkit and xlsx dependencies

### Learnings
- PDF generation with pdfkit requires stream handling with Promise wrapping to buffer output
- XLSX generation with xlsx library uses sheet arrays and can span multiple worksheets for summary and detailed data
- Digital signatures via SHA-256 hash included in both file headers (X-Audit-Hash) and embedded in reports
- Export endpoints reuse the same filtering logic as paginated queries for consistency
- File download responses require proper Content-Type and Content-Disposition headers
- PDF exports format human-readable summaries while XLSX provides structured data suitable for spreadsheet analysis
- Permission-based export ensures only users with VIEW_AUDIT_LOGS can access sensitive audit data

---

## [2026-07-11] - US-007

### Implementation
Implemented GDPR/LOPD compliant data anonymization system allowing administrators to anonymize user data while maintaining audit trails and document/comment associations.

### Files Changed
- `backend/src/extensions/users-permissions/controllers/User.js` - Created new controller with anonymize method that anonymizes user credentials and logs action
- `backend/src/extensions/users-permissions/routes/index.js` - Created custom route for DELETE /api/users/:id/anonymize endpoint
- `backend/src/index.js` - Added ANONYMIZE_USER permission to initial seeder

### Learnings
- Plugin extensions in Strapi can add custom controllers and routes in the extensions folder
- Anonymization preserves user ID to maintain document/comment associations while making user data non-identifiable
- Audit logs capture anonymization actions with who, what, when, and IP address information
- Email addresses must be unique, so anonymized emails use format anonimizado_<id>@docmentor.local to allow multiple anonymizations
- Permission-based access control gates sensitive operations like user anonymization

---

## [2026-07-11] - US-006

### Implementation
Created a comprehensive audit logging system that tracks all changes to projects and documents with filtering, pagination, and retention policies.

### Files Changed
- `backend/src/api/audit/content-types/audit/schema.json` - Added ipAddress field to audit schema
- `backend/src/api/audit/services/audit.js` - Added logAudit method to log entries with IP capture and getAuditLogs method with filtering/pagination support
- `backend/src/api/audit/controllers/audit.js` - Added custom find method with VIEW_AUDIT_LOGS permission check, pagination, and filtering by userId, entityType, entityId, startDate, endDate
- `backend/src/api/project/controllers/project.js` - Added audit logging to create, update, delete, and changeStatus methods with IP address capture
- `backend/src/api/document/controllers/document.js` - Added audit logging to create, update, delete, and changeStatus methods with IP address capture
- `backend/src/api/setting/content-types/setting/schema.json` - Added audit_log_retention_days field with default 1825 days (5 years minimum)
- `backend/src/index.js` - Added VIEW_AUDIT_LOGS permission to initial seeder

### Learnings
- IP address capture from Koa context: ctx.request.ip or fallback to x-forwarded-for header
- Service methods can be extended with custom business logic alongside core service methods
- Audit logging should capture both old and new values as JSON for complete change history
- Filtering in Strapi queries uses where clauses with operators ($gte, $lte) for date range filtering
- Permission-based access control extends to custom endpoints (audit logs queryable only by users with VIEW_AUDIT_LOGS)
- Pagination pattern: use offset/limit (page-1)*pageSize for large result sets
- Retention policies are configuration values stored in settings, not enforced at schema level (cleanup logic would be separate)
- Creating audit entries should not fail the main operation, so audit logs are secondary concerns

---

## [2026-07-11] - US-005

### Implementation
Added workflow status management to documents with state transitions, permission-based access control similar to projects.

### Files Changed
- `backend/src/api/document/content-types/document/schema.json` - Added status field with enum values (Subido, En Revisión, Aprobado, Cambios Solicitados, Archivado)
- `backend/src/api/document/controllers/document.js` - Added changeStatus method with permission validation and state transition enforcement
- `backend/src/api/document/routes/document.js` - Added custom PUT /documents/:id/status route, merged with core routes using spread operator
- `backend/src/index.js` - Added REVIEW_DOCUMENT permission to initial seeder

### Learnings
- Document status workflow follows same pattern as project workflow from US-004
- State transitions defined in changeStatus controller: Subido → En Revisión → Aprobado → Archivado, with alternative En Revisión → Cambios Solicitados → En Revisión
- Custom routes must be spread with core routes to preserve CRUD functionality
- Enum fields in Strapi schema require explicit array of valid values and optional default
- REVIEW_DOCUMENT permission gate ensures only authorized users can change document status

---

## [2026-07-11] - US-004

### Implementation
Added workflow status management to projects with state transitions, permission-based access control, and audit logging for all status changes.

### Files Changed
- `backend/src/api/project/content-types/project/schema.json` - Added status field with enum values (Creado, En Revisión, Aprobado, Finalizado, Rechazado)
- `backend/src/api/audit/content-types/audit/schema.json` - Created audit entity to track all status changes with action, entityType, entityId, userId, oldValue, newValue, timestamp
- `backend/src/api/audit/controllers/audit.js` - Created audit controller
- `backend/src/api/audit/routes/audit.js` - Created audit routes
- `backend/src/api/audit/services/audit.js` - Created audit service
- `backend/src/api/project/controllers/project.js` - Added changeStatus method with permission validation and state transition enforcement
- `backend/src/api/project/routes/project.js` - Added custom PUT /projects/:id/change-status route
- `backend/src/index.js` - Added CHANGE_PROJECT_STATUS permission to initial seeder

### Learnings
- Custom route handlers must be properly namespaced in Strapi (e.g., 'api::project.project.changeStatus')
- State transitions are best validated in the controller before updating the database
- Audit logging should capture old and new values as JSON for flexible queries
- Permission-based state transitions prevent unauthorized status changes while maintaining audit trail
- The status enum must be explicitly defined in schema.json with a default value

---

## [2026-07-11] - US-003

### Implementation
Implemented authentication and authorization middleware to validate JWT tokens and check user permissions before executing protected endpoints.

### Files Changed
- `backend/src/utils/protectedController.js` - Created utility functions for JWT verification and permission checking
- `backend/src/middleware/authenticate.js` - Created authentication middleware (can be used for global auth)
- `backend/src/middleware/authorize.js` - Created authorization middleware factory (can be used for policy-based auth)
- `backend/src/api/project/controllers/project.js` - Added auth checks to create, update, delete methods
- `backend/src/api/document/controllers/document.js` - Added auth checks to create, update, delete methods
- `backend/src/api/rol/controllers/rol.js` - Added auth checks to create, update, delete methods and custom permission endpoints
- `backend/src/api/permission/controllers/permission.js` - Added auth checks to create, update, delete methods
- `backend/src/api/setting/controllers/setting.js` - Added auth checks to create, update, delete methods
- `backend/src/api/notification/controllers/notification.js` - Added auth checks to create, update, delete methods
- `backend/src/api/comment/controllers/comment.js` - Added auth checks to create, update, delete methods
- `backend/src/index.js` - Updated permission seeder with uppercase permission codes matching middleware requirements

### Learnings
- Permission validation in Strapi is best implemented at the controller level by wrapping core controller methods
- JWT verification uses strapi.plugins['users-permissions'].services.jwt.verify()
- User roles and their permissions are fetched via entityService with populated relations
- Each protected endpoint should verify JWT token and check required permission against user's role permissions
- Logging denied access attempts helps with security auditing
- Permission codes use uppercase convention (e.g., CREATE_PROJECT, UPDATE_PROJECT, MANAGE_ROLES)

---

## [2026-07-11] - US-002

### Implementation
Created a permissions model with dynamic role-permission associations and custom endpoints for managing them.

### Files Changed
- `backend/src/api/permission/content-types/permission/schema.json` - Created with code, description, module, isActive fields and many-to-many relation to rols
- `backend/src/api/permission/controllers/permission.js` - Implements soft delete via isActive flag
- `backend/src/api/permission/routes/permission.js` - Created core routes for permissions
- `backend/src/api/permission/services/permission.js` - Created core service for permissions
- `backend/src/api/rol/content-types/rol/schema.json` - Added many-to-many relation to permissions
- `backend/src/api/rol/controllers/rol.js` - Added getRolePermissions, addRolePermission, removeRolePermission methods
- `backend/src/api/rol/routes/rol.js` - Added custom routes for role permission endpoints
- `backend/src/index.js` - Added bootstrap seeder for 14 initial permissions

### Learnings
- Custom route handlers in Strapi must be defined in routes array and mapped to controller methods
- Many-to-many relations use `connect` and `disconnect` operations in entityService.update()
- The inversedBy property in relations allows Strapi to manage both sides of the relationship automatically
- Bootstrap seeding can handle multiple entity types with separate subscription blocks
- Strapi routes are defined relative to `/api/` base path, so `/rols` becomes `/api/rols`

---

## [2026-07-11] - US-001

### Implementation
Created a database roles model with CRUD endpoints and initial data seeding.

### Files Changed
- `backend/src/api/rol/content-types/rol/schema.json` - Updated schema with name, description, isActive fields; disabled draft/publish
- `backend/src/api/rol/controllers/rol.js` - Implemented soft delete via isActive flag
- `backend/src/index.js` - Added bootstrap seeder for 4 initial roles
- `backend/package.json` - Added lint and typecheck scripts

### Learnings
- Strapi automatically creates CRUD endpoints via `createCoreRouter()` - no manual route definition needed
- The collection is accessed at `/api/rols` (not `/api/roles`) based on collectionName in schema
- Soft deletes implemented by setting a boolean flag rather than hard deletion
- Bootstrap function runs once per app startup; use `strapi.db.lifecycles.subscribe()` to seed on table creation

---
