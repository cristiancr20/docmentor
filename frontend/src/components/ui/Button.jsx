import React from "react";
import PropTypes from "prop-types";

/**
 * Botón de la aplicación.
 *
 * La clase del botón primario estaba copiada literalmente en Login, SignUp,
 * NewProject, SubirDocumento y DocumentViewer; cualquier ajuste obligaba a
 * tocar los cinco. Aquí hay cuatro variantes y nada más.
 */

const VARIANTS = {
  primary: "bg-accent text-on-accent hover:bg-accent-soft",
  secondary: "bg-surface-2 text-content border border-line hover:border-line-strong",
  ghost: "text-muted hover:text-content hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZES = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
};

const Button = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={[
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
      "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
      VARIANTS[variant] ?? VARIANTS.primary,
      SIZES[size] ?? SIZES.md,
      fullWidth ? "w-full" : "",
      className,
    ].join(" ")}
    {...props}
  >
    {loading && (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    )}
    {children}
  </button>
);

Button.propTypes = {
  variant: PropTypes.oneOf(["primary", "secondary", "ghost", "danger"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  fullWidth: PropTypes.bool,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Button;
