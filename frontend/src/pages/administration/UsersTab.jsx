import React, { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Search, UserX } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input, { inputClass } from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { PermissionGate } from "../../components/PermissionGate";
import { errorAlert, successAlert } from "../../components/Alerts/Alerts";
import { createAdminUser, updateAdminUser, deleteAdminUser } from "../../core/Admin";
import { formatDate } from "../../utils/format";

const EMPTY_USER_FORM = {
  username: "",
  email: "",
  password: "",
  rols: [],
  isActive: true,
};

/** Pestaña de usuarios: búsqueda, alta/edición y desactivación. */
const UsersTab = ({ users, setUsers, rols }) => {
  const [userSearch, setUserSearch] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [userSaving, setUserSaving] = useState(false);
  // Sustituye al `window.confirm` anterior: el usuario pendiente de desactivar.
  const [userToDeactivate, setUserToDeactivate] = useState(null);

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

  const closeUserModal = () => {
    setUserModalOpen(false);
    setEditingUser(null);
    setUserForm(EMPTY_USER_FORM);
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
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated } : u)));
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
      closeUserModal();
    } catch (err) {
      console.error("Error guardando usuario:", err);
      errorAlert(err.response?.data?.error?.message || "Error al guardar el usuario");
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    const targetUser = userToDeactivate;
    if (!targetUser) return;

    setUserToDeactivate(null);
    try {
      await deleteAdminUser(targetUser.id);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: false } : u)));
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
      u.username?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search)
    );
  });

  return (
    <Card padded={false}>
      <div className="flex flex-col gap-4 border-b border-line p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-content">Gestión de usuarios</h2>
          <p className="mt-1 text-sm text-muted">
            {filteredUsers.length} de {users.length} usuarios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              strokeWidth={1.8}
            />
            <input
              type="text"
              placeholder="Buscar por usuario o email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              aria-label="Buscar usuarios"
              className={`${inputClass} pl-9 md:w-64`}
            />
          </div>

          <PermissionGate permission="MANAGE_USERS">
            <Button onClick={openCreateUserModal}>
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              Nuevo usuario
            </Button>
          </PermissionGate>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={UserX}
            title="No se encontraron usuarios"
            description="Ajusta la búsqueda o crea un usuario nuevo."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Creado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-line transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3 font-medium text-content">{u.username}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-muted">
                    {(u.rols || []).length > 0 ? u.rols.map((r) => r.name).join(", ") : "Sin rol"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.isActive ? "ok" : "danger"}>
                      {u.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <PermissionGate
                      permission="MANAGE_USERS"
                      fallback={<span className="text-muted">—</span>}
                    >
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditUserModal(u)}>
                          Editar
                        </Button>
                        {u.isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger hover:text-danger"
                            onClick={() => setUserToDeactivate(u)}
                          >
                            Desactivar
                          </Button>
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

      <Modal
        open={userModalOpen}
        onClose={closeUserModal}
        size="sm"
        title={editingUser ? "Editar usuario" : "Nuevo usuario"}
        description={
          editingUser
            ? "Actualiza los datos y roles de la cuenta."
            : "Crea una cuenta y asígnale sus roles."
        }
      >
        <form id="admin-user-form" onSubmit={handleSaveUser} className="flex flex-col gap-4">
          <Input
            id="admin-user-username"
            label="Nombre de usuario"
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
          />

          <Input
            id="admin-user-email"
            label="Email"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />

          <Input
            id="admin-user-password"
            label="Contraseña"
            type="password"
            hint={editingUser ? "Déjala en blanco para no cambiarla." : undefined}
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-content">Roles</legend>
            {rols.map((rol) => (
              <label
                key={rol.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm text-content transition-colors hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={userForm.rols.includes(rol.id)}
                  onChange={() => handleUserFormRolToggle(rol.id)}
                  className="h-4 w-4 rounded border-line accent-accent"
                />
                {rol.attributes?.name}
              </label>
            ))}
          </fieldset>

          {editingUser && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-content">
              <input
                type="checkbox"
                checked={userForm.isActive}
                onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-line accent-accent"
              />
              Usuario activo
            </label>
          )}
        </form>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={closeUserModal}>
            Cancelar
          </Button>
          <Button type="submit" form="admin-user-form" loading={userSaving}>
            {userSaving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(userToDeactivate)}
        onClose={() => setUserToDeactivate(null)}
        size="sm"
        title="Desactivar usuario"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUserToDeactivate(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteUser}>
              Desactivar
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          ¿Desactivar al usuario{" "}
          <span className="font-medium text-content">{userToDeactivate?.username}</span>? No podrá
          iniciar sesión, pero sus datos se conservarán.
        </p>
      </Modal>
    </Card>
  );
};

UsersTab.propTypes = {
  users: PropTypes.array.isRequired,
  setUsers: PropTypes.func.isRequired,
  rols: PropTypes.array.isRequired,
};

export default UsersTab;
