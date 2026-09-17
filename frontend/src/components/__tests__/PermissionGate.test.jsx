import React from "react";
import { render, screen } from "@testing-library/react";
import { PermissionGate } from "../PermissionGate";
import { usePermission } from "../../context/PermissionContext";

jest.mock("../../context/PermissionContext", () => ({
  usePermission: jest.fn(),
}));

const mockPermissions = (permissions) => {
  usePermission.mockReturnValue({
    permissions,
    hasPermission: (code) => permissions.includes(code),
    loading: false,
    error: null,
  });
};

describe("PermissionGate", () => {
  it("renderiza los hijos cuando el usuario tiene el permiso", () => {
    mockPermissions(["APPROVE_DOCUMENT"]);

    render(
      <PermissionGate permission="APPROVE_DOCUMENT">
        <button>Aprobar</button>
      </PermissionGate>
    );

    expect(screen.getByText("Aprobar")).toBeInTheDocument();
  });

  it("oculta los hijos cuando el usuario no tiene el permiso", () => {
    mockPermissions(["VIEW_PROJECT"]);

    render(
      <PermissionGate permission="APPROVE_DOCUMENT">
        <button>Aprobar</button>
      </PermissionGate>
    );

    expect(screen.queryByText("Aprobar")).not.toBeInTheDocument();
  });

  it("muestra el fallback cuando el usuario no tiene el permiso", () => {
    mockPermissions([]);

    render(
      <PermissionGate
        permission="MANAGE_USERS"
        fallback={<span>Sin acceso</span>}
      >
        <button>Gestionar</button>
      </PermissionGate>
    );

    expect(screen.getByText("Sin acceso")).toBeInTheDocument();
    expect(screen.queryByText("Gestionar")).not.toBeInTheDocument();
  });

  it("con multiples permisos usa logica OR por defecto", () => {
    mockPermissions(["COMMENT_DOCUMENT"]);

    render(
      <PermissionGate permissions={["REVIEW_DOCUMENT", "COMMENT_DOCUMENT"]}>
        <button>Revisar</button>
      </PermissionGate>
    );

    expect(screen.getByText("Revisar")).toBeInTheDocument();
  });

  it("con requireAll exige todos los permisos", () => {
    mockPermissions(["COMMENT_DOCUMENT"]);

    render(
      <PermissionGate
        permissions={["REVIEW_DOCUMENT", "COMMENT_DOCUMENT"]}
        requireAll
      >
        <button>Revisar</button>
      </PermissionGate>
    );

    expect(screen.queryByText("Revisar")).not.toBeInTheDocument();
  });
});
