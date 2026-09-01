import React from "react";
import PropTypes from "prop-types";
import { ShieldOff } from "lucide-react";

export const ACCESS_DENIED_MESSAGE =
  "Acceso denegado: no tienes los permisos necesarios para realizar esta acción.";

const AccessDenied = ({ message = ACCESS_DENIED_MESSAGE }) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center rounded-xl border border-line bg-danger-wash px-6 py-12 text-center"
  >
    <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-surface text-danger">
      <ShieldOff className="h-5 w-5" strokeWidth={1.8} />
    </div>
    <p className="font-display text-lg font-semibold text-content">Acceso denegado</p>
    <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
  </div>
);

AccessDenied.propTypes = {
  message: PropTypes.string,
};

export default AccessDenied;
