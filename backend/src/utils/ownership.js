'use strict';

/**
 * Control de pertenencia.
 *
 * Los permisos por código (UPDATE_DOCUMENT, DELETE_PROJECT, ...) responden a
 * "¿este rol puede hacer esto?", pero no a "¿sobre este registro concreto?".
 * Sin lo segundo, cualquier estudiante con UPDATE_DOCUMENT podía modificar o
 * borrar el documento de otro simplemente cambiando el id de la URL.
 *
 * Aquí se resuelve la segunda pregunta: un proyecto pertenece a su tutor y a
 * sus estudiantes; un documento hereda la pertenencia de su proyecto. Los roles
 * de gestión ven todo el corpus.
 */

// Roles con visibilidad global: la coordinación necesita revisar cualquier
// proyecto y el superadmin administra el sistema.
const ELEVATED_ROL_TYPES = ['coordinador', 'superadmin'];

const getUserRolTypes = async (userId, strapi) => {
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    populate: { rols: true },
  });

  return (user?.rols || []).map((rol) => rol.rolType).filter(Boolean);
};

const isElevated = async (userId, strapi) => {
  const rolTypes = await getUserRolTypes(userId, strapi);
  return rolTypes.some((rolType) => ELEVATED_ROL_TYPES.includes(rolType));
};

/** Filtro Strapi que limita los proyectos a los del usuario. */
const projectScopeFilter = (userId) => ({
  $or: [{ tutor: { id: userId } }, { students: { id: userId } }],
});

/**
 * Añade un filtro a `ctx.query` conservando los que ya venían de la petición.
 * Se combinan con $and para que el cliente no pueda ampliar su propio alcance
 * mandando filtros que sobrescriban al nuestro.
 */
const applyFilter = (ctx, filter) => {
  const existing = ctx.query?.filters;
  ctx.query = {
    ...ctx.query,
    filters: existing ? { $and: [existing, filter] } : filter,
  };
};

/** ¿Puede el usuario operar sobre este proyecto? */
const canAccessProject = async (projectId, userId, strapi) => {
  if (await isElevated(userId, strapi)) return true;

  const project = await strapi.db.query('api::project.project').findOne({
    where: { id: projectId },
    populate: { tutor: true, students: true },
  });

  if (!project) return false;

  if (project.tutor?.id === userId) return true;
  return (project.students || []).some((student) => student.id === userId);
};

/** ¿Puede el usuario operar sobre este documento? Hereda del proyecto. */
const canAccessDocument = async (documentId, userId, strapi) => {
  if (await isElevated(userId, strapi)) return true;

  const document = await strapi.db.query('api::document.document').findOne({
    where: { id: documentId },
    populate: { project: true },
  });

  // Un documento sin proyecto no tiene dueño con el que comparar: solo lo
  // alcanzan los roles de gestión, que ya salieron antes.
  if (!document?.project) return false;

  return canAccessProject(document.project.id, userId, strapi);
};

/**
 * Corta la petición con 403 si el usuario no es dueño del recurso.
 * Devuelve true cuando la operación puede continuar.
 */
const requireProjectAccess = async (ctx, projectId, userId, strapi) => {
  if (await canAccessProject(projectId, userId, strapi)) return true;

  strapi.log.warn(`Acceso denegado: usuario ${userId} sobre el proyecto ${projectId}`);
  ctx.forbidden('No tienes acceso a este proyecto');
  return false;
};

const requireDocumentAccess = async (ctx, documentId, userId, strapi) => {
  if (await canAccessDocument(documentId, userId, strapi)) return true;

  strapi.log.warn(`Acceso denegado: usuario ${userId} sobre el documento ${documentId}`);
  ctx.forbidden('No tienes acceso a este documento');
  return false;
};

module.exports = {
  ELEVATED_ROL_TYPES,
  getUserRolTypes,
  isElevated,
  projectScopeFilter,
  applyFilter,
  canAccessProject,
  canAccessDocument,
  requireProjectAccess,
  requireDocumentAccess,
};
