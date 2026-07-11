import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { usePermissionCheck } from "../context/PermissionContext";
import { PermissionGate } from "../components/PermissionGate";
import { errorAlert, successAlert } from "../components/Alerts/Alerts";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getRols,
  getAllPermissions,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getAdminAuditLogs,
  exportAuditReport,
  getSettings,
  createSetting,
  updateSetting,
  setActualEmail,
} from "../core/Admin";

const SECTIONS = [
  { key: "usuarios", label: "Usuarios" },
  { key: "roles", label: "Roles" },
  { key: "auditoria", label: "Auditoría" },
  { key: "configuracion", label: "Configuración" },
];

const EMPTY_USER_FORM = {
  username: "",
  email: "",
  password: "",
  rols: [],
  isActive: true,
};

function Administration() {
  const { user } = useAuth();
  const canManageRoles = usePermissionCheck("MANAGE_ROLES");

  const [activeSection, setActiveSection] = useState("usuarios");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Usuarios */
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [userSaving, setUserSaving] = useState(false);

  /* Roles */
  const [rols, setRols] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRol, setSelectedRol] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [rolePermissionsLoading, setRolePermissionsLoading] = useState(false);

  /* Auditoría */
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditEntityFilter, setAuditEntityFilter] = useState("all");
  const [exportLoading, setExportLoading] = useState(null);

  /* Configuración */
  const [settings, setSettings] = useState([]);
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [retentionDays, setRetentionDays] = useState(1825);
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("Semanal");
  const [configSaving, setConfigSaving] = useState(false);

  const fetchAuditLogs = useCallback(async (entityType) => {
    const filters = { pageSize: 100 };
    if (entityType && entityType !== "all") {
      filters.entityType = entityType;
    }
    const logs = await getAdminAuditLogs(filters);
    setAuditLogs(logs);
  }, []);

  const applySettings = (settingsData) => {
    setSettings(settingsData);
    const configRecord = settingsData[0];
    if (configRecord) {
      const attrs = configRecord.attributes || {};
      if (attrs.audit_log_retention_days) {
        setRetentionDays(attrs.audit_log_retention_days);
      }
      if (attrs.backup_enabled !== null && attrs.backup_enabled !== undefined) {
        setBackupEnabled(attrs.backup_enabled);
      }
      if (attrs.backup_frequency) {
        setBackupFrequency(attrs.backup_frequency);
      }
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          getAdminUsers(),
          getRols(),
          getAllPermissions(),
          getAdminAuditLogs({ pageSize: 100 }),
          getSettings(),
        ]);

        const [usersRes, rolsRes, permissionsRes, auditRes, settingsRes] = results;

        if (usersRes.status === "fulfilled") setUsers(usersRes.value);
        if (rolsRes.status === "fulfilled") setRols(rolsRes.value);
        if (permissionsRes.status === "fulfilled") setPermissions(permissionsRes.value);
        if (auditRes.status === "fulfilled") setAuditLogs(auditRes.value);
        if (settingsRes.status === "fulfilled") applySettings(settingsRes.value);

        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          console.error("Errores al cargar el dashboard:", failed);
          setError("Algunas secciones no pudieron cargarse correctamente");
        }
      } catch (err) {
        console.error("Error cargando el dashboard de administración:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /* ==================== USUARIOS ==================== */

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm(EMPTY_USER_FORM);
    setUserModalOpen(true);
  };

  const openEditUserModal = (targetUser) => {
    setEditingUser(targetUser);
    setUserForm({
      username: targetUser.username,
      email: targetUser.email,
      password: "",
      rols: (targetUser.rols || []).map((r) => r.id),
      isActive: targetUser.isActive,
    });
    setUserModalOpen(true);
  };

  const handleUserFormRolToggle = (rolId) => {
    setUserForm((prev) => ({
      ...prev,
      rols: prev.rols.includes(rolId)
        ? prev.rols.filter((id) => id !== rolId)
        : [...prev.rols, rolId],
    }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!userForm.username || !userForm.email) {
      errorAlert("Username y email son requeridos");
      return;
    }
    if (!editingUser && !userForm.password) {
      errorAlert("La contraseña es requerida para crear un usuario");
      return;
    }

    try {
      setUserSaving(true);
      if (editingUser) {
        const payload = {
          username: userForm.username,
          email: userForm.email,
          rols: userForm.rols,
          isActive: userForm.isActive,
        };
        if (userForm.password) payload.password = userForm.password;

        const updated = await updateAdminUser(editingUser.id, payload);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated } : u))
        );
        successAlert("Usuario actualizado correctamente");
      } else {
        const created = await createAdminUser({
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          rols: userForm.rols,
        });
        setUsers((prev) => [{ ...created, createdAt: new Date().toISOString() }, ...prev]);
        successAlert("Usuario creado correctamente");
      }
      setUserModalOpen(false);
      setEditingUser(null);
      setUserForm(EMPTY_USER_FORM);
    } catch (err) {
      console.error("Error guardando usuario:", err);
      errorAlert(err.response?.data?.error?.message || "Error al guardar el usuario");
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const confirmed = window.confirm(
      `¿Desactivar al usuario "${targetUser.username}"? El usuario no podrá iniciar sesión pero sus datos se conservarán.`
    );
    if (!confirmed) return;

    try {
      await deleteAdminUser(targetUser.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: false } : u))
      );
      successAlert("Usuario desactivado correctamente");
    } catch (err) {
      console.error("Error desactivando usuario:", err);
      errorAlert("Error al desactivar el usuario");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return (
      u.username?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    );
  });

  /* ==================== ROLES ==================== */

  const handleSelectRol = async (rol) => {
    try {
      setSelectedRol(rol);
      setRolePermissionsLoading(true);
      const perms = await getRolePermissions(rol.id);
      setRolePermissions(perms.map((p) => p.id));
    } catch (err) {
      console.error("Error cargando permisos del rol:", err);
      errorAlert("Error al cargar los permisos del rol");
    } finally {
      setRolePermissionsLoading(false);
    }
  };

  const handleTogglePermission = async (permissionId) => {
    if (!selectedRol || !canManageRoles) return;

    const hasPermission = rolePermissions.includes(permissionId);
    try {
      if (hasPermission) {
        await removePermissionFromRole(selectedRol.id, permissionId);
        setRolePermissions((prev) => prev.filter((id) => id !== permissionId));
      } else {
        await addPermissionToRole(selectedRol.id, permissionId);
        setRolePermissions((prev) => [...prev, permissionId]);
      }
      successAlert("Permisos del rol actualizados");
    } catch (err) {
      console.error("Error actualizando permisos del rol:", err);
      errorAlert("Error al actualizar los permisos del rol");
    }
  };

  const permissionsByModule = permissions.reduce((acc, perm) => {
    const module = perm.attributes?.module || "otros";
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  /* ==================== AUDITORÍA ==================== */

  const handleAuditFilterChange = async (entityType) => {
    setAuditEntityFilter(entityType);
    try {
      await fetchAuditLogs(entityType);
    } catch (err) {
      console.error("Error filtrando logs de auditoría:", err);
      errorAlert("Error al cargar los logs de auditoría");
    }
  };

  const handleExport = async (format) => {
    try {
      setExportLoading(format);
      const filters = {};
      if (auditEntityFilter !== "all") filters.entityType = auditEntityFilter;
      await exportAuditReport(format, filters);
      successAlert(`Reporte ${format.toUpperCase()} exportado correctamente`);
    } catch (err) {
      console.error("Error exportando reporte:", err);
      errorAlert("Error al exportar el reporte de auditoría");
    } finally {
      setExportLoading(null);
    }
  };

  const getActionBadgeClass = (action) => {
    const base = "inline-block px-2 py-1 rounded-full text-xs font-medium";
    if (!action) return `${base} bg-gray-100 text-gray-800`;
    if (action.includes("CREATE")) return `${base} bg-green-100 text-green-800`;
    if (action.includes("DELETE") || action.includes("ANONYMIZE"))
      return `${base} bg-red-100 text-red-800`;
    if (action.includes("UPDATE") || action.includes("CHANGE"))
      return `${base} bg-blue-100 text-blue-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  /* ==================== CONFIGURACIÓN ==================== */

  const handleSaveSmtpEmail = async (e) => {
    e.preventDefault();
    if (!smtpEmail) return;

    try {
      setSmtpSaving(true);
      await createSetting({ email_notifications: smtpEmail });
      successAlert("Email creado correctamente");
      setSmtpEmail("");
      const refreshed = await getSettings();
      applySettings(refreshed);
    } catch (err) {
      console.error("Error creando email SMTP:", err);
      errorAlert("Error al guardar el correo");
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSetActualEmail = async (emailId) => {
    try {
      await setActualEmail(settings, emailId);
      setSettings((prev) =>
        prev.map((s) => ({
          ...s,
          attributes: { ...s.attributes, isActual: s.id === emailId },
        }))
      );
      successAlert("Email actualizado correctamente");
    } catch (err) {
      console.error("Error actualizando email actual:", err);
      errorAlert("Error al actualizar el correo");
    }
  };

  const handleSaveConfig = async () => {
    if (retentionDays < 1825) {
      errorAlert("La retención mínima es de 1825 días (5 años) por normativa");
      return;
    }

    try {
      setConfigSaving(true);
      const configData = {
        audit_log_retention_days: parseInt(retentionDays),
        backup_enabled: backupEnabled,
        backup_frequency: backupFrequency,
      };

      const configRecord = settings[0];
      if (configRecord) {
        await updateSetting(configRecord.id, configData);
      } else {
        await createSetting(configData);
      }
      successAlert("Configuración guardada correctamente");
      const refreshed = await getSettings();
      applySettings(refreshed);
    } catch (err) {
      console.error("Error guardando configuración:", err);
      errorAlert("Error al guardar la configuración");
    } finally {
      setConfigSaving(false);
    }
  };

  /* ==================== HELPERS ==================== */

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("es-ES");
  };

  const smtpEmails = settings.filter((s) => s.attributes?.email_notifications);

  if (loading) {
    return (
      <div className="Admin">
        <Navbar />
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="Admin">
      <Navbar />
      <Header />
      <main className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Panel de Administración, {user?.username}
            </h1>
            <p className="text-gray-600">
              Gestiona usuarios, roles, auditoría y configuración del sistema
            </p>
          </motion.div>

          {/* Metrics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm font-medium">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm font-medium">Usuarios Activos</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm font-medium">Roles</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{rols.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm font-medium">Logs Recientes</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{auditLogs.length}</p>
            </div>
          </motion.div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
              {error}
            </div>
          )}

          {/* Section Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-6 border-b border-gray-200"
          >
            {SECTIONS.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                  activeSection === section.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {section.label}
              </button>
            ))}
          </motion.div>

          {/* ==================== SECCIÓN USUARIOS ==================== */}
          {activeSection === "usuarios" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Buscar por usuario o email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <PermissionGate permission="MANAGE_USERS">
                    <button
                      onClick={openCreateUserModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
                    >
                      + Nuevo Usuario
                    </button>
                  </PermissionGate>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No se encontraron usuarios</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Roles</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Creado</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {(u.rols || []).length > 0
                              ? u.rols.map((r) => r.name).join(", ")
                              : "Sin rol"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                u.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {u.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-ES") : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <PermissionGate permission="MANAGE_USERS" fallback={<span className="text-gray-400 text-sm">-</span>}>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => openEditUserModal(u)}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                  Editar
                                </button>
                                {u.isActive && (
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                                  >
                                    Desactivar
                                  </button>
                                )}
                              </div>
                            </PermissionGate>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== SECCIÓN ROLES ==================== */}
          {activeSection === "roles" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Roles</h2>
                <div className="space-y-2">
                  {rols.map((rol) => (
                    <button
                      key={rol.id}
                      onClick={() => handleSelectRol(rol)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        selectedRol?.id === rol.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {rol.attributes?.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            rol.attributes?.isActive !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {rol.attributes?.isActive !== false ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      {rol.attributes?.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {rol.attributes.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedRol
                    ? `Permisos de ${selectedRol.attributes?.name}`
                    : "Selecciona un rol para ver sus permisos"}
                </h2>

                {!canManageRoles && selectedRol && (
                  <p className="text-sm text-orange-600 mb-4">
                    No tienes permiso para modificar los permisos (solo lectura)
                  </p>
                )}

                {rolePermissionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : selectedRol ? (
                  <div className="space-y-6">
                    {Object.entries(permissionsByModule).map(([module, perms]) => (
                      <div key={module}>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                          {module}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 ${
                                canManageRoles ? "cursor-pointer hover:bg-gray-50" : "opacity-75"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={rolePermissions.includes(perm.id)}
                                onChange={() => handleTogglePermission(perm.id)}
                                disabled={!canManageRoles}
                                className="h-4 w-4 text-blue-600 rounded"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {perm.attributes?.code}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {perm.attributes?.description}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Haz clic en un rol de la lista para visualizar y editar sus permisos
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== SECCIÓN AUDITORÍA ==================== */}
          {activeSection === "auditoria" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Logs de Auditoría</h2>
                  <p className="text-sm text-gray-500">Últimos 100 registros del sistema</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={auditEntityFilter}
                    onChange={(e) => handleAuditFilterChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas las entidades</option>
                    <option value="project">Proyectos</option>
                    <option value="document">Documentos</option>
                    <option value="user">Usuarios</option>
                  </select>
                  <PermissionGate permission="VIEW_AUDIT_LOGS">
                    <button
                      onClick={() => handleExport("pdf")}
                      disabled={exportLoading !== null}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      {exportLoading === "pdf" ? "Exportando..." : "Exportar PDF"}
                    </button>
                    <button
                      onClick={() => handleExport("xlsx")}
                      disabled={exportLoading !== null}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      {exportLoading === "xlsx" ? "Exportando..." : "Exportar XLSX"}
                    </button>
                  </PermissionGate>
                </div>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay registros de auditoría</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acción</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Entidad</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID Entidad</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID Usuario</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {auditLogs.slice(0, 100).map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(log.timestamp || log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={getActionBadgeClass(log.action)}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{log.entityType}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{log.entityId}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{log.userId}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{log.ipAddress || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== SECCIÓN CONFIGURACIÓN ==================== */}
          {activeSection === "configuracion" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* SMTP */}
              <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Configuración de Correo (SMTP)
                </h2>
                <form onSubmit={handleSaveSmtpEmail} className="flex flex-col md:flex-row gap-3 mb-6">
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={smtpEmail}
                    onChange={(e) => setSmtpEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={smtpSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {smtpSaving ? "Guardando..." : "Agregar Correo"}
                  </button>
                </form>

                {smtpEmails.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Correo Electrónico</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {smtpEmails.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {s.attributes.email_notifications}
                            </td>
                            <td className="px-4 py-3">
                              {s.attributes.isActual ? (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  En uso
                                </span>
                              ) : (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No en uso
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {!s.attributes.isActual && (
                                <button
                                  onClick={() => handleSetActualEmail(s.id)}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                  Volver Actual
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hay correos registrados.</p>
                )}
              </div>

              {/* Retención de datos */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Retención de Datos</h2>
                <label className="block mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    Días de retención de logs de auditoría
                  </span>
                  <input
                    type="number"
                    min={1825}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">
                    Mínimo 1825 días (5 años) por normativa de auditoría
                  </span>
                </label>
              </div>

              {/* Backup */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Respaldo (Backup)</h2>
                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupEnabled}
                    onChange={(e) => setBackupEnabled(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Respaldos automáticos habilitados
                  </span>
                </label>
                <label className="block mb-4">
                  <span className="text-sm font-medium text-gray-700">Frecuencia de respaldo</span>
                  <select
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value)}
                    disabled={!backupEnabled}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="Diario">Diario</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensual">Mensual</option>
                  </select>
                </label>
              </div>

              <div className="lg:col-span-2">
                <PermissionGate permission="MANAGE_SETTINGS">
                  <button
                    onClick={handleSaveConfig}
                    disabled={configSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {configSaving ? "Guardando..." : "Guardar Configuración"}
                  </button>
                </PermissionGate>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Modal Crear/Editar Usuario */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>

            <form onSubmit={handleSaveUser}>
              <label className="block mb-3">
                <span className="text-sm font-medium text-gray-700">Nombre de usuario</span>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block mb-3">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block mb-3">
                <span className="text-sm font-medium text-gray-700">
                  {editingUser ? "Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
                </span>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700 block mb-2">Roles</span>
                <div className="space-y-2">
                  {rols.map((rol) => (
                    <label key={rol.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userForm.rols.includes(rol.id)}
                        onChange={() => handleUserFormRolToggle(rol.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{rol.attributes?.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editingUser && (
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Usuario activo</span>
                </label>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setUserModalOpen(false);
                    setEditingUser(null);
                    setUserForm(EMPTY_USER_FORM);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {userSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Administration;
