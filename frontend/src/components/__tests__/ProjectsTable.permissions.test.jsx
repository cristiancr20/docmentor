import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProjectsTable from "../ProjectsTable";
import { usePermission } from "../../context/PermissionContext";

jest.mock("../../context/PermissionContext", () => ({
  usePermission: jest.fn(),
}));

jest.mock("../../core/Projects", () => ({
  deleteProject: jest.fn(),
}));

const mockPermissions = (permissions) => {
  usePermission.mockReturnValue({
    permissions,
    hasPermission: (code) => permissions.includes(code),
    loading: false,
    error: null,
  });
};

const projects = [
  {
    id: 1,
    attributes: {
      title: "Proyecto de prueba",
      publishedAt: "2026-01-15T10:00:00.000Z",
    },
  },
];

const columns = [
  {
    key: "title",
    label: "Título",
    render: (project) => project.attributes.title,
  },
];

const renderTable = () =>
  render(
    <MemoryRouter>
      <ProjectsTable
        projects={projects}
        columns={columns}
        linkBase="/project"
        fetchProjects={jest.fn()}
      />
    </MemoryRouter>
  );

describe("ProjectsTable permisos", () => {
  it("muestra editar y eliminar con UPDATE_PROJECT y DELETE_PROJECT", () => {
    mockPermissions(["UPDATE_PROJECT", "DELETE_PROJECT"]);
    renderTable();

    expect(screen.getByTitle("Editar")).toBeInTheDocument();
    expect(screen.getByTitle("Eliminar")).toBeInTheDocument();
  });

  it("oculta editar y eliminar sin permisos", () => {
    mockPermissions(["VIEW_PROJECT"]);
    renderTable();

    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Eliminar")).not.toBeInTheDocument();
  });

  it("muestra solo eliminar con DELETE_PROJECT", () => {
    mockPermissions(["DELETE_PROJECT"]);
    renderTable();

    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument();
    expect(screen.getByTitle("Eliminar")).toBeInTheDocument();
  });
});
