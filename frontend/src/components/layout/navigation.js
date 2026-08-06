import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  ScrollText,
  Users,
} from "lucide-react";

/**
 * Navegación por rol, en un solo sitio.
 *
 * Las rutas de App.js y los enlaces de la barra se declaraban por separado, así
 * que era fácil que un rol tuviera acceso a una vista sin enlace para llegar
 * (le pasaba a coordinador con /audit-logs).
 */
export const NAV_BY_ROLE = {
  estudiante: [
    { to: "/student/dashboard", label: "Inicio", icon: LayoutDashboard },
    { to: "/student/projects/view", label: "Mis proyectos", icon: FolderKanban },
  ],
  tutor: [
    { to: "/tutor/dashboard", label: "Inicio", icon: LayoutDashboard },
    { to: "/tutor/projects/view", label: "Proyectos asignados", icon: ClipboardList },
  ],
  coordinador: [
    { to: "/coordinator/dashboard", label: "Inicio", icon: LayoutDashboard },
    { to: "/audit-logs", label: "Auditoría", icon: ScrollText },
  ],
  superadmin: [
    { to: "/admin/dashboard", label: "Administración", icon: Users },
    { to: "/tutor/dashboard", label: "Revisión", icon: ClipboardList },
    { to: "/audit-logs", label: "Auditoría", icon: ScrollText },
  ],
};

export const ROLE_LABELS = {
  estudiante: "Estudiante",
  tutor: "Tutor",
  coordinador: "Coordinación",
  superadmin: "Administración",
};

export const navItemsFor = (roles = []) => {
  const items = roles.flatMap((role) => NAV_BY_ROLE[role] ?? []);

  // Un usuario con varios roles no debe ver el mismo enlace repetido.
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.to)) return false;
    seen.add(item.to);
    return true;
  });
};
