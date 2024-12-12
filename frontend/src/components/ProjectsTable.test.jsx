import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import ProjectsTable from "./ProjectsTable";
import Swal from "sweetalert2";
import { decryptData } from "../utils/encryption";

import { FaPen } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => { }); // Silencia los warnings
  jest.spyOn(console, 'error').mockImplementation(() => { }); // Silencia los errores
});

afterAll(() => {
  console.warn.mockRestore(); // Restaura el comportamiento normal
  console.error.mockRestore();
});


jest.mock("../core/Projects");
jest.mock("../utils/encryption");
jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

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
        onClick={() => mockHandleEdit(projects[0].id)}
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

  test("calls mockHandleDelete when delete button is clicked", () => {
    const mockHandleDelete = jest.fn();

    Swal.fire.mockResolvedValue({ isConfirmed: true });

    render(
      <button
        className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg"
        onClick={() => mockHandleDelete(projects[0].id)}
        title="Eliminar"
      >
        <MdDelete className="text-red-600 text-lg" />
      </button>
    );

    const button = screen.getByTitle("Eliminar");
    expect(button).toBeInTheDocument();

    // call the alert function when the button is clicked
    fireEvent.click(button);

    // Verificar que Swal.fire se llama con los parámetros correctos
    waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith({
        title: "¿Estás seguro?",
        text: "No podrás revertir esta acción!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar!",
        cancelButtonText: "Cancelar",
      });
    });

    // Simular la confirmación de la alerta
    waitFor(() => {
      expect(mockHandleDelete).toHaveBeenCalledWith(projects[0].id);
    });

    // Check button has correct classes
    expect(button).toHaveClass(
      "flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg"
    );
  });


});
