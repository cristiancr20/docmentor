import React from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import { navItemsFor } from "./navigation";

/**
 * Estructura común de las vistas con sesión.
 *
 * Antes no existía: cada una de las 12 páginas repetía a mano `<Navbar />` y
 * `<Header />`, y ese Header era una segunda barra que solo mostraba dos logos
 * institucionales, ocupando altura en todas las vistas sin aportar navegación.
 * Esos logos viven ahora al pie de la barra lateral.
 */
const AppLayout = ({ title, description, actions, children }) => {
  const { user } = useAuth();
  const items = navItemsFor(user?.rols ?? []);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar items={items} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />

        <main className="flex-1 overflow-y-auto p-6 pb-28 md:p-8 md:pb-8">
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                {title && (
                  <h1 className="font-display text-2xl font-bold text-content md:text-3xl">
                    {title}
                  </h1>
                )}
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}

          {children}
        </main>
      </div>

      <BottomNav items={items} />
    </div>
  );
};

AppLayout.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node,
};

export default AppLayout;
