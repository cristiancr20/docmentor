module.exports = async () => {
    const existingRoles = await strapi.entityService.findMany('api::rol.rol', {});
  
    if (existingRoles.length === 0) {
      const roles = [
        { tipoRol: 'estudiante' },
        { tipoRol: 'tutor' },
      ];
  
      for (const role of roles) {
        await strapi.entityService.create('api::rol.rol', { data: role });
        console.log(`Rol creado: ${role.tipoRol}`);
      }
    }
  };
  