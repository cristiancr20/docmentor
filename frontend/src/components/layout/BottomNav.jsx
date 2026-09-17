import React from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

/**
 * Navegación móvil: píldora flotante.
 *
 * En móvil la barra lateral desaparece; antes no había sustituto y la única
 * navegación era el menú hamburguesa del topbar.
 */
const BottomNav = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[90%] max-w-md -translate-x-1/2 rounded-2xl border border-line bg-surface p-1.5 shadow-pop md:hidden">
      <ul className="flex items-center justify-around gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-accent-wash text-accent"
                    : "text-muted hover:text-content",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
              <span className="truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

BottomNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      to: PropTypes.string,
      label: PropTypes.string,
      icon: PropTypes.elementType,
    })
  ),
};

export default BottomNav;
