import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useAuth } from "./AuthContext";
import api, { getAuthToken } from "../core/apiClient";

const PermissionContext = createContext();

export const usePermission = () => useContext(PermissionContext);

export const usePermissionCheck = (permissionCode) => {
  const { permissions } = usePermission();
  return permissions.includes(permissionCode);
};

export const hasPermissions = (permissionCodes, permissions) => {
  if (!Array.isArray(permissionCodes)) {
    return permissions.includes(permissionCodes);
  }
  return permissionCodes.every(code => permissions.includes(code));
};

export const PermissionProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getAuthToken()) {
        setPermissions([]);
        return;
      }

      // La URL salía hardcodeada a localhost:1337, así que en producción los
      // permisos nunca cargaban. Va por el cliente central, que resuelve la
      // base desde API_URL y adjunta el token.
      const { data } = await api.get("/api/auth/me/permissions");
      setPermissions(data.data || []);
    } catch (err) {
      console.error("Error al obtener los permisos:", err);
      setError(err.message);
      // Fallar cerrado: sin permisos confirmados por el servidor, ninguno.
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    // Los permisos se piden siempre al servidor. Antes se cacheaban en
    // localStorage en texto plano y se releían sin validar, así que bastaba con
    // escribir userPermissions a mano en la consola para desbloquear la
    // interfaz de administración.
    if (user) {
      fetchPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [user, authLoading, fetchPermissions]);

  const hasPermission = useCallback(
    (permissionCode) => permissions.includes(permissionCode),
    [permissions]
  );

  const value = {
    permissions,
    hasPermission,
    loading,
    error,
    refresh: fetchPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

PermissionProvider.propTypes = {
  children: PropTypes.node,
};
