import React from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import { FileText } from "lucide-react";

/**
 * Barra lateral: isla oscura en ambos temas.
 *
 * Usa la rampa `dark-*` en lugar de los tokens que cambian con el tema, para
 * que se mantenga oscura también en modo claro. Es el mismo recurso del panel
 * del gym: ancla la vista y separa navegación de contenido.
 */
const Sidebar = ({ items }) => (
  <aside className="hidden w-64 shrink-0 flex-col border-r border-dark-line bg-dark-surface md:flex">
    <div className="flex h-16 items-center gap-2 border-b border-dark-line px-5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-dark-accent text-dark-on-accent">
        <FileText className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <span className="font-display text-lg font-bold text-dark-content">DocMentor</span>
    </div>

    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-dark-accent-wash text-dark-accent"
                : "text-dark-muted hover:bg-dark-surface-2 hover:text-dark-content",
            ].join(" ")
          }
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {label}
        </NavLink>
      ))}
    </nav>

    <div className="border-t border-dark-line p-4">
      <p className="font-mono text-[11px] leading-relaxed text-dark-muted">
        Universidad Nacional de Loja
        <br />
        Carrera de Computación
      </p>
    </div>
  </aside>
);

Sidebar.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      to: PropTypes.string,
      label: PropTypes.string,
      icon: PropTypes.elementType,
    })
  ),
};

export default Sidebar;
