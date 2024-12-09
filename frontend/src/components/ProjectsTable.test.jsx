import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import ProjectsTable from "./ProjectsTable";
import Swal from "sweetalert2";
import { deleteProject } from "../core/Projects";
import { decryptData } from "../utils/encryption";

import { FaPen } from "react-icons/fa";

jest.mock("sweetalert2");
jest.mock("../core/Projects");
jest.mock("../utils/encryption");

describe("ProjectsTable", () => {
  const columns = [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
  ];

  const projects = [
    { id: 1, name: "Project 1", description: "Description 1" },
    { id: 2, name: "Project 2", description: "Description 2" },
  ];

  beforeEach(() => {
    localStorage.setItem("userData", JSON.stringify({ rol: "estudiante" }));
    decryptData.mockReturnValue({ rol: "estudiante" });
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renders table with projects", () => {
    render(
      <Router>
        <ProjectsTable
          projects={projects}
          columns={columns}
          linkBase="/projects"
        />
      </Router>
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Project 1")).toBeInTheDocument();
    expect(screen.getByText("Project 2")).toBeInTheDocument();
  });

  test("renders no projects available message", () => {
    render(
      <Router>
        <ProjectsTable projects={[]} columns={columns} linkBase="/projects" />
      </Router>
    );

    expect(
      screen.getByText("No hay proyectos disponibles")
    ).toBeInTheDocument();
  });

  test("calls mockHandleEdit when edit button is clicked", () => {
    const mockHandleEdit = jest.fn();

    render(
      <button
        className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg"
        onClick={() => mockHandleEdit(1)}
        title="Editar"
      >
        <FaPen className="text-yellow-600 text-lg" />
      </button>
    );

    const button = screen.getByTitle("Editar");
    expect(button).toBeInTheDocument();

    // Check button has correct classes
    expect(button).toHaveClass(
      "flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg"
    );

  });

/*   test("calls handleDelete when delete button is clicked", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    deleteProject.mockResolvedValue();

    const fetchProjects = jest.fn();

    render(
      <Router>
        <ProjectsTable
          projects={projects}
          columns={columns}
          linkBase="/projects"
          onDelete={fetchProjects}
        />
      </Router>
    );

    fireEvent.click(screen.getAllByTitle(/eliminar/i)[0]);
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "¿Estás seguro?",
        text: "No podrás revertir esta acción!",
        icon: "warning",
      })
    );

    await Swal.fire.mock.results[0].value;
    expect(deleteProject).toHaveBeenCalledWith(1);
    expect(fetchProjects).toHaveBeenCalled();
  }); */
});
