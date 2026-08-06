import React, { useEffect, useState } from "react";
import { AlertTriangle, ScrollText, Shield, UserCheck, Users } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import { SkeletonStats, SkeletonRows } from "../components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getAdminUsers,
  getRols,
  getAllPermissions,
  getAdminAuditLogs,
  getSettings,
} from "../core/Admin";
import UsersTab from "./administration/UsersTab";
import RolesTab from "./administration/RolesTab";
import AuditTab from "./administration/AuditTab";
import SettingsTab from "./administration/SettingsTab";

const SECTIONS = [
  { key: "usuarios", label: "Usuarios" },
  { key: "roles", label: "Roles" },
  { key: "auditoria", label: "Auditoría" },
  { key: "configuracion", label: "Configuración" },
];

/**
 * Contenedor del panel de administración.
 *
 * Carga en paralelo los datos de las cuatro pestañas y delega el render de cada
 * una en `src/pages/administration/`. Antes todo vivía en este archivo, mil
 * líneas con las cuatro secciones mezcladas.
 */
function Administration() {
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState("usuarios");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);
  const [rols, setRols] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState([]);

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
        if (settingsRes.status === "fulfilled") setSettings(settingsRes.value);

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

  if (loading) {
    return (
      <AppLayout title="Panel de administración" description="Cargando los datos del sistema…">
        <div className="flex flex-col gap-6">
          <SkeletonStats count={4} />
          <Card>
            <SkeletonRows count={6} />
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Panel de administración"
      description={`Hola ${user?.username ?? ""}. Gestiona usuarios, roles, auditoría y configuración del sistema.`}
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total usuarios" value={users.length} icon={Users} tone="accent" />
        <StatCard
          label="Usuarios activos"
          value={users.filter((u) => u.isActive).length}
          icon={UserCheck}
          tone="ok"
        />
        <StatCard label="Roles" value={rols.length} icon={Shield} tone="info" />
        <StatCard label="Logs recientes" value={auditLogs.length} icon={ScrollText} tone="warn" />
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-xl border border-line bg-danger-wash px-4 py-3 text-sm text-danger"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-1 border-b border-line">
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setActiveSection(section.key)}
            className={[
              "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeSection === section.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-content",
            ].join(" ")}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === "usuarios" && (
        <UsersTab users={users} setUsers={setUsers} rols={rols} />
      )}

      {activeSection === "roles" && <RolesTab rols={rols} permissions={permissions} />}

      {activeSection === "auditoria" && (
        <AuditTab auditLogs={auditLogs} setAuditLogs={setAuditLogs} />
      )}

      {activeSection === "configuracion" && (
        <SettingsTab settings={settings} setSettings={setSettings} />
      )}
    </AppLayout>
  );
}

export default Administration;
