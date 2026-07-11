import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useAuth } from "./AuthContext";
import { decryptData } from "../utils/encryption";

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

      const encryptedToken = localStorage.getItem("jwtToken");
      if (!encryptedToken) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const decryptedToken = decryptData(encryptedToken);
      if (!decryptedToken) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:1337/api/auth/me/permissions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decryptedToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }

      const data = await response.json();
      const permissionCodes = data.data || [];

      setPermissions(permissionCodes);
      localStorage.setItem("userPermissions", JSON.stringify(permissionCodes));
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setError(err.message);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (user && user.token) {
      fetchPermissions();
    } else {
      const cachedPermissions = localStorage.getItem("userPermissions");
      if (cachedPermissions) {
        try {
          setPermissions(JSON.parse(cachedPermissions));
        } catch (err) {
          console.error("Error parsing cached permissions:", err);
          setPermissions([]);
        }
      } else {
        setPermissions([]);
      }
      setLoading(false);
    }
  }, [user, authLoading, fetchPermissions]);

  const value = {
    permissions,
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
