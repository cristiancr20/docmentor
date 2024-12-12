import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import EditProject from "./EditProject";

beforeAll(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {}); // Silencia los warnings
  jest.spyOn(console, "error").mockImplementation(() => {}); // Silencia los errores
});

afterAll(() => {
  console.warn.mockRestore(); // Restaura el comportamiento normal
  console.error.mockRestore();
});

jest.mock("./EditProject");

describe("EDit Project Componente", () => {
  it("should initialize form fields with project data when project prop is provided", () => {
    const mockProject = {
      id: 1,
      Title: "Test Project",
      Descripcion: "Test Description",
      tutor: { id: "123" },
    };

    const {getByLabelText} = render(
        <Router>
            <EditProject project={mockProject} />
        </Router>
    );
    
  
    expect(getByLabelText(/title/i)).toHaveValue('Test Project');
    expect(getByLabelText('Descripción')).toHaveValue('Test Description');
    expect(getByLabelText('Seleccionar Tutor')).toHaveValue('123');

  });
});
