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
  },
};
