import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Login from "./Login";
import * as Auth from "../core/Autentication"; // Ajusta la importación según sea necesario
import { useNavigate } from "react-router-dom";


// Mocks
jest.mock("../core/Autentication");
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn(),
}));

describe("Login Component", () => {
    let mockNavigate;

    beforeEach(() => {
        mockNavigate = jest.fn();
        useNavigate.mockReturnValue(mockNavigate);
    });

    test("should render login form", () => {

        render(
            <Router>
                <Login />
            </Router>
        );


        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
        expect(true).toBe(true);
    });

    test("should show error alert if login fails", async () => {
        // Simulamos el login fallido
        Auth.login.mockRejectedValueOnce(new Error("Error en las credenciales"));

        render(
            <Router>
                <Login />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "test@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/contraseña/i), {
            target: { value: "wrongpassword" },
        });

        fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        // Esperar a que el mensaje de error aparezca
        await waitFor(() => expect(screen.getByText(/Credenciales incorrectas/i)).toBeInTheDocument());
        expect(true).toBe(true);

    });

    test("should redirect to the correct route after successful login", async () => {
        // Simulamos el login exitoso
        const mockAuthResponse = {
            jwt: "fake-jwt-token",
            user: { id: 1, username: "testUser" },
        };
        Auth.login.mockResolvedValueOnce(mockAuthResponse);
        Auth.getUserWithRole.mockResolvedValueOnce({ rol: { tipoRol: "estudiante" } });

        render(
            <Router>
                <Login />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "cristian.capa@unl.edu.ec" },
        });
        fireEvent.change(screen.getByLabelText(/contraseña/i), {
            target: { value: "password123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        // Esperar a que se haya llamado al navigate
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/student/dashboard"));
        expect(true).toBe(true);

    });
});
