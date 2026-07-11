import React from "react";
import { usePermissionCheck, hasPermissions, usePermission } from "../context/PermissionContext";
import { PermissionGate } from "../components/PermissionGate";

export const PermissionExample = () => {
  const { permissions, loading, error, refresh } = usePermission();
  const canViewAuditLogs = usePermissionCheck("VIEW_AUDIT_LOGS");

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  if (error) {
    return <div>Error loading permissions: {error}</div>;
  }

  return (
    <div>
      <h2>Permission System Example</h2>

      <section>
        <h3>Current User Permissions:</h3>
        <ul>
          {permissions.map(perm => (
            <li key={perm}>{perm}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Using usePermissionCheck hook:</h3>
        <p>Can view audit logs: {canViewAuditLogs ? "Yes" : "No"}</p>
      </section>

      <section>
        <h3>Using hasPermissions utility:</h3>
        <p>
          Has MANAGE_ROLES AND CHANGE_PROJECT_STATUS:
          {hasPermissions(["MANAGE_ROLES", "CHANGE_PROJECT_STATUS"], permissions) ? " Yes" : " No"}
        </p>
      </section>

      <section>
        <h3>Using PermissionGate component:</h3>
        <PermissionGate
          permission="MANAGE_ROLES"
          fallback={<p>You do not have permission to manage roles</p>}
        >
          <p>You have permission to manage roles!</p>
        </PermissionGate>

        <PermissionGate
          permissions={["VIEW_AUDIT_LOGS", "MANAGE_ROLES"]}
          requireAll={true}
          fallback={<p>You need all permissions to access this</p>}
        >
          <p>You have all required permissions!</p>
        </PermissionGate>
      </section>

      <button onClick={refresh}>Refresh Permissions</button>
    </div>
  );
};
