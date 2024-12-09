import React from "react";
import { render, screen} from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Dashboard from "./Dashboard";


beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { }); // Silencia los warnings
    jest.spyOn(console, 'error').mockImplementation(() => { }); // Silencia los errores
});

afterAll(() => {
    console.warn.mockRestore(); // Restaura el comportamiento normal
    console.error.mockRestore();
});


describe("Dashboard Component", () => {


    test("debe mostrar el Dashboard", () => {
        render(
            <Router>
                <Dashboard />
            </Router>
        );

        expect(screen.getByText(/Bienvenido a DocMentor/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /registrarse/i })).toBeInTheDocument();
        expect(true).toBe(true);
    });
});