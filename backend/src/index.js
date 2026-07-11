'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      models: ['api::rol.rol'],
      async afterCreate() {
        const existingRoles = await strapi.entityService.findMany('api::rol.rol');
        if (existingRoles.length === 0) {
          const initialRoles = [
            { name: 'Estudiante', description: 'Rol para estudiantes', isActive: true },
            { name: 'Tutor', description: 'Rol para tutores', isActive: true },
            { name: 'Coordinador', description: 'Rol para coordinadores', isActive: true },
            { name: 'Admin', description: 'Rol para administradores', isActive: true },
          ];

          for (const role of initialRoles) {
            await strapi.entityService.create('api::rol.rol', { data: role });
          }
        }
      },
    });

    strapi.db.lifecycles.subscribe({
      models: ['api::permission.permission'],
      async afterCreate() {
        const existingPermissions = await strapi.entityService.findMany('api::permission.permission');
        if (existingPermissions.length === 0) {
          const initialPermissions = [
            { code: 'view_project', description: 'Ver proyectos', module: 'projects', isActive: true },
            { code: 'create_project', description: 'Crear proyectos', module: 'projects', isActive: true },
            { code: 'edit_project', description: 'Editar proyectos', module: 'projects', isActive: true },
            { code: 'delete_project', description: 'Eliminar proyectos', module: 'projects', isActive: true },
            { code: 'view_document', description: 'Ver documentos', module: 'documents', isActive: true },
            { code: 'create_document', description: 'Crear documentos', module: 'documents', isActive: true },
            { code: 'edit_document', description: 'Editar documentos', module: 'documents', isActive: true },
            { code: 'delete_document', description: 'Eliminar documentos', module: 'documents', isActive: true },
            { code: 'comment_document', description: 'Comentar en documentos', module: 'documents', isActive: true },
            { code: 'approve_document', description: 'Aprobar documentos', module: 'documents', isActive: true },
            { code: 'view_users', description: 'Ver usuarios', module: 'users', isActive: true },
            { code: 'manage_users', description: 'Gestionar usuarios', module: 'users', isActive: true },
            { code: 'manage_roles', description: 'Gestionar roles', module: 'roles', isActive: true },
            { code: 'manage_permissions', description: 'Gestionar permisos', module: 'roles', isActive: true },
          ];

          for (const permission of initialPermissions) {
            await strapi.entityService.create('api::permission.permission', { data: permission });
          }
        }
      },
    });
  },
};
