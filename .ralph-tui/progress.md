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
