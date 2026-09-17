import React, { useState } from "react";
import PropTypes from "prop-types";
import { Lock, ShieldCheck } from "lucide-react";
import Card, { CardHeader } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonRows } from "../../components/ui/Skeleton";
import { usePermissionCheck } from "../../context/PermissionContext";
import { errorAlert, successAlert } from "../../components/Alerts/Alerts";
import {
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
} from "../../core/Admin";

/** Pestaña de roles: lista de roles a la izquierda y sus permisos a la derecha. */
const RolesTab = ({ rols, permissions }) => {
  const canManageRoles = usePermissionCheck("MANAGE_ROLES");

  const [selectedRol, setSelectedRol] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [rolePermissionsLoading, setRolePermissionsLoading] = useState(false);

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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader title="Roles" description="Selecciona uno para ver sus permisos." />

        <div className="flex flex-col gap-2">
          {rols.map((rol) => {
            const isActive = rol.attributes?.isActive !== false;
            const isSelected = selectedRol?.id === rol.id;

            return (
              <button
                key={rol.id}
                type="button"
                onClick={() => handleSelectRol(rol)}
                className={[
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                  isSelected
                    ? "border-accent bg-accent-wash"
                    : "border-line hover:border-line-strong hover:bg-surface-2",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-content">{rol.attributes?.name}</span>
                  <Badge tone={isActive ? "ok" : "danger"}>
                    {isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {rol.attributes?.description && (
                  <p className="mt-1 text-sm text-muted">{rol.attributes.description}</p>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader
          title={selectedRol ? `Permisos de ${selectedRol.attributes?.name}` : "Permisos"}
          description={
            selectedRol ? undefined : "Elige un rol de la lista para ver y editar sus permisos."
          }
        />

        {!canManageRoles && selectedRol && (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-warn-wash px-3 py-2 text-sm text-warn">
            <Lock className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            No tienes permiso para modificar los permisos (solo lectura).
          </div>
        )}

        {rolePermissionsLoading ? (
          <SkeletonRows count={4} />
        ) : selectedRol ? (
          <div className="flex flex-col gap-6">
            {Object.entries(permissionsByModule).map(([module, perms]) => (
              <div key={module}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  {module}
                </h3>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className={[
                        "flex items-start gap-3 rounded-lg border border-line px-3 py-2 transition-colors",
                        canManageRoles
                          ? "cursor-pointer hover:border-line-strong hover:bg-surface-2"
                          : "opacity-75",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                        disabled={!canManageRoles}
                        className="mt-0.5 h-4 w-4 rounded border-line accent-accent"
                      />
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium text-content">
                          {perm.attributes?.code}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{perm.attributes?.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="Ningún rol seleccionado"
            description="Haz clic en un rol de la lista para visualizar y editar sus permisos."
          />
        )}
      </Card>
    </div>
  );
};

RolesTab.propTypes = {
  rols: PropTypes.array.isRequired,
  permissions: PropTypes.array.isRequired,
};

export default RolesTab;
