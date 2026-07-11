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
            { code: 'VIEW_PROJECT', description: 'Ver proyectos', module: 'projects', isActive: true },
            { code: 'CREATE_PROJECT', description: 'Crear proyectos', module: 'projects', isActive: true },
            { code: 'UPDATE_PROJECT', description: 'Actualizar proyectos', module: 'projects', isActive: true },
            { code: 'DELETE_PROJECT', description: 'Eliminar proyectos', module: 'projects', isActive: true },
            { code: 'VIEW_DOCUMENT', description: 'Ver documentos', module: 'documents', isActive: true },
            { code: 'CREATE_DOCUMENT', description: 'Crear documentos', module: 'documents', isActive: true },
            { code: 'UPDATE_DOCUMENT', description: 'Actualizar documentos', module: 'documents', isActive: true },
            { code: 'DELETE_DOCUMENT', description: 'Eliminar documentos', module: 'documents', isActive: true },
            { code: 'COMMENT_DOCUMENT', description: 'Comentar en documentos', module: 'documents', isActive: true },
            { code: 'APPROVE_DOCUMENT', description: 'Aprobar documentos', module: 'documents', isActive: true },
            { code: 'VIEW_USERS', description: 'Ver usuarios', module: 'users', isActive: true },
            { code: 'MANAGE_USERS', description: 'Gestionar usuarios', module: 'users', isActive: true },
            { code: 'MANAGE_ROLES', description: 'Gestionar roles', module: 'roles', isActive: true },
            { code: 'MANAGE_PERMISSIONS', description: 'Gestionar permisos', module: 'roles', isActive: true },
            { code: 'MANAGE_SETTINGS', description: 'Gestionar configuración', module: 'settings', isActive: true },
            { code: 'MANAGE_NOTIFICATIONS', description: 'Gestionar notificaciones', module: 'notifications', isActive: true },
            { code: 'MANAGE_COMMENTS', description: 'Gestionar comentarios', module: 'comments', isActive: true },
          ];

          for (const permission of initialPermissions) {
            await strapi.entityService.create('api::permission.permission', { data: permission });
          }
        }
      },
    });
  },
};
