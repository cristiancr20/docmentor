import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import EditProject from "./EditProject";

// Mock cualquier contexto o hook que uses
/* jest.mock('./path-to-your-tutores-context', () => ({
  useTutoresContext: () => ({
    tutores: [
      { id: '123', username: 'Test Tutor' },
      { id: '456', username: 'Another Tutor' }
    ]
  })
})); */

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => { }); // Silencia los warnings
  jest.spyOn(console, 'error').mockImplementation(() => { }); // Silencia los errores
});

afterAll(() => {
  console.warn.mockRestore(); // Restaura el comportamiento normal
  console.error.mockRestore();
});

describe("EditProject Component", () => {
  it("renders the edit project form correctly", () => {
    render(
      <Router>
        <EditProject />
      </Router>
    );

    // Verificar que los elementos principales del formulario estén presentes
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByLabelText('Seleccionar Tutor')).toBeInTheDocument();

    // Verificar botones o elementos de acción
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

/*   it("renders form fields with correct input types", () => {
    render(
      <Router>
        <EditProject />
      </Router>
    );

    const titleInput = screen.getByLabelText('Título');
    const descripcionInput = screen.getByLabelText('Descripción');
    const tutorSelect = screen.getByLabelText('Seleccionar Tutor');

    expect(titleInput).toHaveAttribute('type', 'text');
    expect(tutorSelect.tagName).toBe('SELECT');
  }); */
});