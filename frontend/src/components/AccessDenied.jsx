import React from "react";
import PropTypes from "prop-types";
import { ShieldOff } from "lucide-react";

export const ACCESS_DENIED_MESSAGE =
  "Acceso denegado: no tienes los permisos necesarios para realizar esta acción.";

const AccessDenied = ({ message = ACCESS_DENIED_MESSAGE }) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center text-center bg-red-50 border border-red-200 rounded-xl p-8 m-4"
  >
    <ShieldOff className="w-12 h-12 text-red-500 mb-4" />
    <h2 className="text-xl font-bold text-red-700 mb-2">Acceso denegado</h2>
    <p className="text-red-600">{message}</p>
  </div>
);

AccessDenied.propTypes = {
  message: PropTypes.string,
};

export default AccessDenied;
