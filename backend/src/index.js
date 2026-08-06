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
   *
   * Aquí había un seed de roles y permisos que nunca llegaba a ejecutarse: iba
   * dentro del `afterCreate` del propio modelo que pretendía crear y se
   * activaba solo si no existía ningún registro, condición imposible porque el
   * hook dispara justo después de insertar uno. De haberse cumplido, habría
   * entrado en recursión infinita creando roles dentro del afterCreate de rol.
   * Además su catálogo de permisos divergía del real (rol "Admin" en vez de
   * "Superadmin", módulos en plural), así que adoptarlo habría roto la
   * autorización.
   *
   * El seed vive en `scripts/seed-test-users.js` y se ejecuta a mano:
   *   node scripts/seed-test-users.js
   */
  bootstrap(/*{ strapi }*/) {},
};
