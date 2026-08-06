import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";

/**
 * Marco de las vistas sin sesión (login, registro).
 *
 * Sustituye al fondo anterior, que era una imagen enlazada en caliente desde
 * Pinterest: dependía de un dominio ajeno y podía cambiar o desaparecer sin
 * aviso. Ahora el fondo se dibuja con CSS (grid de plano + halo del acento).
 */
const AuthLayout = ({ title, description, children, footer }) => (
  <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4 py-12">
    <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
    <div className="pointer-events-none absolute inset-0 hero-glow" aria-hidden="true" />

    <div className="absolute right-4 top-4">
      <ThemeToggle />
    </div>

    <div className="relative w-full max-w-md">
      <Link to="/" className="mb-8 flex items-center justify-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-on-accent">
          <FileText className="h-5 w-5" strokeWidth={2} />
        </div>
        <span className="font-display text-xl font-bold text-content">DocMentor</span>
      </Link>

      <div className="rounded-xl border border-line bg-surface p-8 shadow-card">
        <div className="mb-6">
          <h1 className="font-display text-xl font-bold text-content">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>

        {children}
      </div>

      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </div>
  </div>
);

AuthLayout.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
};

export default AuthLayout;
