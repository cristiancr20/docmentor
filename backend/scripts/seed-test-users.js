'use strict';

/**
 * Seed de datos de prueba para DocMentor.
 *
 * Crea: permisos, roles custom (con rolType) y un usuario por cada rol,
 * y otorga los permisos de users-permissions necesarios para que el
 * frontend funcione (login + dashboards).
 *
 * Uso:  node scripts/seed-test-users.js   (con el dev server detenido)
 */

const strapiFactory = require('@strapi/strapi');

// --- Catálogo de permisos (code -> módulo) ---
const PERMISSIONS = [
  ['CREATE_PROJECT', 'project'],
  ['UPDATE_PROJECT', 'project'],
  ['DELETE_PROJECT', 'project'],
  ['VIEW_PROJECT', 'project'],
  ['CHANGE_PROJECT_STATUS', 'project'],
  ['CREATE_DOCUMENT', 'document'],
  ['UPDATE_DOCUMENT', 'document'],
  ['DELETE_DOCUMENT', 'document'],
  ['REVIEW_DOCUMENT', 'document'],
  ['APPROVE_DOCUMENT', 'document'],
  ['COMMENT_DOCUMENT', 'document'],
  ['MANAGE_COMMENTS', 'comment'],
  ['MANAGE_NOTIFICATIONS', 'notification'],
  ['VIEW_AUDIT_LOGS', 'audit'],
  ['MANAGE_USERS', 'user'],
  ['VIEW_USERS', 'user'],
  ['ANONYMIZE_USER', 'user'],
  ['MANAGE_ROLES', 'role'],
  ['MANAGE_PERMISSIONS', 'permission'],
  ['MANAGE_SETTINGS', 'setting'],
];

const ALL_CODES = PERMISSIONS.map(([c]) => c);

// --- Roles custom ---
const ROLES = [
  {
    rolType: 'estudiante',
    name: 'Estudiante',
    description: 'Estudiante que crea proyectos y sube documentos',
    permissions: ['CREATE_PROJECT', 'UPDATE_PROJECT', 'VIEW_PROJECT', 'CREATE_DOCUMENT', 'UPDATE_DOCUMENT', 'DELETE_DOCUMENT', 'COMMENT_DOCUMENT'],
  },
  {
    rolType: 'tutor',
    name: 'Tutor',
    description: 'Tutor que revisa y aprueba documentos y proyectos',
    permissions: ['VIEW_PROJECT', 'CHANGE_PROJECT_STATUS', 'REVIEW_DOCUMENT', 'APPROVE_DOCUMENT', 'COMMENT_DOCUMENT', 'MANAGE_COMMENTS', 'MANAGE_NOTIFICATIONS'],
  },
  {
    rolType: 'coordinador',
    name: 'Coordinador',
    description: 'Coordinador con visibilidad de auditoría y gestión de settings',
    permissions: ['VIEW_PROJECT', 'CHANGE_PROJECT_STATUS', 'VIEW_AUDIT_LOGS', 'VIEW_USERS', 'MANAGE_SETTINGS'],
  },
  {
    rolType: 'superadmin',
    name: 'Superadmin',
    description: 'Administrador con todos los permisos',
    permissions: ALL_CODES,
  },
];

// --- Usuarios de prueba (uno por rol) ---
const USERS = [
  { username: 'estudiante', email: 'estudiante@docmentor.local', password: 'Estudiante123', rolType: 'estudiante' },
  { username: 'tutor', email: 'tutor@docmentor.local', password: 'Tutor123', rolType: 'tutor' },
  { username: 'coordinador', email: 'coordinador@docmentor.local', password: 'Coordinador123', rolType: 'coordinador' },
  { username: 'admin', email: 'admin@docmentor.local', password: 'Admin123', rolType: 'superadmin' },
];

// --- Permisos users-permissions a otorgar por rol nativo ---
// Estas acciones son las que gestiona este seed: al ejecutarlo se sincroniza el
// rol para que tenga EXACTAMENTE las listadas, revocando cualquier otra que se
// hubiera concedido antes. Las acciones de `auth.*` (login, registro, etc.) no
// entran aquí y quedan intactas.
const CRUD = ['find', 'findOne', 'create', 'update', 'delete'];
const MANAGED_PREFIXES = [
  'api::project.project.',
  'api::document.document.',
  'api::comment.comment.',
  'api::notification.notification.',
  'api::rol.rol.',
  'api::permission.permission.',
  'api::setting.setting.',
  'api::audit.audit.',
  'plugin::users-permissions.user.',
  'plugin::upload.content-api.',
];

// Datos operativos: los controllers custom validan permiso y pertenencia.
const OPERATIONAL_UIDS = [
  'api::project.project',
  'api::document.document',
  'api::comment.comment',
  'api::notification.notification',
];

const AUTH_ACTIONS = [
  ...OPERATIONAL_UIDS.flatMap((uid) => CRUD.map((a) => `${uid}.${a}`)),

  // Catálogos: solo lectura. La escritura pasa por las rutas custom de rol,
  // que exigen MANAGE_ROLES.
  'api::rol.rol.find',
  'api::rol.rol.findOne',
  'api::permission.permission.find',
  'api::permission.permission.findOne',
  'api::setting.setting.find',
  'api::setting.setting.findOne',
  'api::setting.setting.update',

  // Auditoría: lectura y exportación, nunca escritura. La pista de auditoría
  // solo la escribe el backend; permitir create/update/delete desde el cliente
  // destruiría el no repudio que justifica el módulo. El controller exige
  // además VIEW_AUDIT_LOGS.
  'api::audit.audit.find',
  'api::audit.audit.findOne',
  'api::audit.audit.export',

  'plugin::users-permissions.user.find',
  'plugin::users-permissions.user.findOne',
  'plugin::users-permissions.user.me',

  // Subida de archivos. Sin este permiso POST /api/upload responde 403 y no se
  // puede adjuntar ningún documento, que es la función central de la
  // aplicación. No se conceden `find`/`findOne`, que listan la mediateca
  // completa, ni `destroy`, que permitiría borrar el archivo de cualquiera:
  // el visor carga los PDF por su URL estática, no por la API.
  'plugin::upload.content-api.upload',
];

// Sin sesión no se lee nada: `user.find` público exponía el correo de todos los
// usuarios a cualquiera que llamara a GET /api/users.
const PUBLIC_ACTIONS = [];

async function main() {
  const strapi = await strapiFactory().load();

  try {
    // 1) Permisos (content-type api::permission.permission)
    const permByCode = {};
    for (const [code, module] of PERMISSIONS) {
      let existing = await strapi.db.query('api::permission.permission').findOne({ where: { code } });
      if (!existing) {
        existing = await strapi.entityService.create('api::permission.permission', {
          data: { code, module, description: code, isActive: true },
        });
        console.log(`  + permiso ${code}`);
      }
      permByCode[code] = existing.id;
    }

    // 2) Roles custom
    const rolByType = {};
    for (const role of ROLES) {
      let existing = await strapi.db.query('api::rol.rol').findOne({ where: { name: role.name } });
      const permIds = role.permissions.map((c) => permByCode[c]).filter(Boolean);
      if (!existing) {
        existing = await strapi.entityService.create('api::rol.rol', {
          data: {
            name: role.name,
            rolType: role.rolType,
            description: role.description,
            isActive: true,
            permissions: permIds,
          },
        });
        console.log(`  + rol ${role.name} (${role.rolType}) con ${permIds.length} permisos`);
      } else {
        existing = await strapi.entityService.update('api::rol.rol', existing.id, {
          data: { rolType: role.rolType, permissions: permIds },
        });
        console.log(`  ~ rol ${role.name} actualizado`);
      }
      rolByType[role.rolType] = existing.id;
    }

    // 3) Usuarios (uno por rol)
    const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
    for (const u of USERS) {
      const existing = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email: u.email } });
      // La contraseña se pasa en texto plano: Strapi hashea automáticamente los
      // campos de tipo `password`. (Pre-hashear provoca doble hasheo y login inválido.)
      const data = {
        username: u.username,
        email: u.email,
        password: u.password,
        provider: 'local',
        confirmed: true,
        blocked: false,
        // Explícito: dejarlo sin valor guardaba NULL, y los filtros por
        // `isInstitutional = false` no encuentran NULL (por ejemplo el que usa
        // el selector de tutores al crear un proyecto).
        isInstitutional: false,
        isActive: true,
        role: authRole ? authRole.id : undefined,
        rols: [rolByType[u.rolType]],
      };
      if (!existing) {
        await strapi.entityService.create('plugin::users-permissions.user', { data });
        console.log(`  + usuario ${u.email} (${u.rolType})`);
      } else {
        await strapi.entityService.update('plugin::users-permissions.user', existing.id, {
          data: {
            password: u.password,
            confirmed: true,
            blocked: false,
            isInstitutional: false,
            isActive: true,
            role: data.role,
            rols: data.rols,
          },
        });
        console.log(`  ~ usuario ${u.email} actualizado`);
      }
    }

    // 4) Permisos users-permissions
    // Sincroniza (no solo añade): concede las acciones que faltan y revoca las
    // que sobran dentro de MANAGED_PREFIXES, para que ejecutar el seed sobre una
    // base antigua cierre los permisos que se hubieran abierto de más.
    const syncPermissions = async (roleType, actions) => {
      const role = await strapi.db
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: roleType } });

      const desired = new Set(actions);
      const current = await strapi.db
        .query('plugin::users-permissions.permission')
        .findMany({ where: { role: role.id } });

      let granted = 0;
      for (const action of desired) {
        if (!current.some((p) => p.action === action)) {
          await strapi.db
            .query('plugin::users-permissions.permission')
            .create({ data: { action, role: role.id } });
          granted += 1;
        }
      }

      let revoked = 0;
      for (const perm of current) {
        const isManaged = MANAGED_PREFIXES.some((prefix) => perm.action.startsWith(prefix));
        if (isManaged && !desired.has(perm.action)) {
          await strapi.db
            .query('plugin::users-permissions.permission')
            .delete({ where: { id: perm.id } });
          revoked += 1;
        }
      }

      console.log(`  = ${roleType}: ${desired.size} permisos (+${granted} nuevos, -${revoked} revocados)`);
    };

    await syncPermissions('public', PUBLIC_ACTIONS);
    await syncPermissions('authenticated', AUTH_ACTIONS);

    console.log('\n✅ Seed completado.');
  } catch (err) {
    console.error('\n❌ Error en seed:', err);
    process.exitCode = 1;
  } finally {
    await strapi.destroy();
  }
}

main().then(() => process.exit(process.exitCode || 0));
