import React, { useState } from "react";
import PropTypes from "prop-types";
import { Eye, EyeOff } from "lucide-react";

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-content " +
  "placeholder:text-muted transition-colors hover:border-line-strong " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

/** Campo de formulario con etiqueta, error y, para contraseñas, toggle de visibilidad. */
const Input = ({ label, id, type = "text", error, hint, className = "", ...props }) => {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-content">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          className={[inputClass, isPassword ? "pr-10" : "", className].join(" ")}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition-colors hover:text-content"
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.node,
  id: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.node,
  hint: PropTypes.node,
  className: PropTypes.string,
};

export const Select = ({ label, id, error, className = "", children, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-content">
        {label}
      </label>
    )}
    <select id={id} className={[inputClass, className].join(" ")} {...props}>
      {children}
    </select>
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
);

Select.propTypes = {
  label: PropTypes.node,
  id: PropTypes.string,
  error: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
};

export const Textarea = ({ label, id, error, className = "", ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-content">
        {label}
      </label>
    )}
    <textarea id={id} className={[inputClass, "resize-y", className].join(" ")} {...props} />
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
);

Textarea.propTypes = {
  label: PropTypes.node,
  id: PropTypes.string,
  error: PropTypes.node,
  className: PropTypes.string,
};

export default Input;
