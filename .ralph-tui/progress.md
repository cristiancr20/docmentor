# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Strapi Content Types**: Use schema.json in `src/api/<entity>/content-types/<entity>/` to define collection types with required/unique constraints
- **Soft Delete Pattern**: Implement in controller by updating `isActive` field instead of removing records
- **Database Seeding**: Use bootstrap lifecycle hook in `src/index.js` with `strapi.db.lifecycles.subscribe()` to seed data on app startup
- **CRUD Routes**: Strapi's `createCoreRouter()` auto-generates GET, POST, PUT, DELETE endpoints for collection types

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
