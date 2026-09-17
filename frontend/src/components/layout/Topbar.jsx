import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FileText, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { initialsOf } from "../../utils/format";
import { ROLE_LABELS } from "./navigation";
import NotificationBell from "../NotificationBell";
import ThemeToggle from "../ui/ThemeToggle";

/** Barra superior: sigue el tema (a diferencia de la lateral, que es isla oscura). */
const Topbar = ({ user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const displayName = user?.username || user?.name || user?.email || "Usuario";
  const role = user?.rols?.[0];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-5 md:px-8">
      {/* La marca solo aparece en móvil: en escritorio ya está en la lateral. */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-on-accent">
          <FileText className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <span className="font-display text-base font-bold text-content">DocMentor</span>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-wash font-mono text-xs font-medium text-accent">
              {initialsOf(displayName)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-content">
                {displayName}
              </span>
              {role && (
                <span className="block text-xs leading-tight text-muted">
                  {ROLE_LABELS[role] ?? role}
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
              >
                <div className="border-b border-line px-4 py-3">
                  <p className="truncate text-sm font-medium text-content">{displayName}</p>
                  <p className="truncate font-mono text-xs text-muted">{user?.email}</p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger-wash"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.8} />
                  Cerrar sesión
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

Topbar.propTypes = {
  user: PropTypes.object,
};

export default Topbar;
