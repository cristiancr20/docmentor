import React from "react";
import PropTypes from "prop-types";
import { usePermission } from "../context/PermissionContext";

export const PermissionGate = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}) => {
  const { permissions: userPermissions } = usePermission();

  let hasAccess = false;

  if (permission) {
    hasAccess = userPermissions.includes(permission);
  } else if (permissions) {
    if (requireAll) {
      hasAccess = permissions.every(p => userPermissions.includes(p));
    } else {
      hasAccess = permissions.some(p => userPermissions.includes(p));
    }
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return fallback;
};

PermissionGate.propTypes = {
  permission: PropTypes.string,
  permissions: PropTypes.arrayOf(PropTypes.string),
  requireAll: PropTypes.bool,
  fallback: PropTypes.node,
  children: PropTypes.node,
};
