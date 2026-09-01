import React from "react";
import { render, screen } from "@testing-library/react";
import CommentsPanel from "../CommentsPanel";
import { usePermission } from "../../context/PermissionContext";

jest.mock("../../context/PermissionContext", () => ({
  usePermission: jest.fn(),
}));

jest.mock("../../core/Comments", () => ({
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
}));

const mockPermissions = (permissions) => {
  usePermission.mockReturnValue({
    permissions,
    hasPermission: (code) => permissions.includes(code),
    loading: false,
    error: null,
  });
};

const comments = [
  {
    id: 1,
    attributes: {
      correction: "Corregir la introducción",
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-01-16T10:00:00.000Z",
    },
  },
];

describe("CommentsPanel permisos", () => {
  it("muestra editar y eliminar comentarios con MANAGE_COMMENTS", () => {
    mockPermissions(["MANAGE_COMMENTS"]);
    render(
      <CommentsPanel
        comments={comments}
        onUpdateComments={jest.fn()}
        onCommentClick={jest.fn()}
      />
    );

    expect(screen.getByTitle("Editar")).toBeInTheDocument();
    expect(screen.getByTitle("Eliminar")).toBeInTheDocument();
  });

  it("oculta editar y eliminar comentarios sin MANAGE_COMMENTS", () => {
    mockPermissions(["COMMENT_DOCUMENT"]);
    render(
      <CommentsPanel
        comments={comments}
        onUpdateComments={jest.fn()}
        onCommentClick={jest.fn()}
      />
    );

    expect(screen.getByText("Corregir la introducción")).toBeInTheDocument();
    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Eliminar")).not.toBeInTheDocument();
  });
});
