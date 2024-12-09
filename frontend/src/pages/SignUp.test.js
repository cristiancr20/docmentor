import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import SignUp from "./SignUp";
import * as Auth from "../core/Autentication"; // Ajusta la importación según sea necesario
import { useNavigate } from "react-router-dom";

// Mocks
jest.mock("../core/Autentication");
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: jest.fn(),
}));

beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {}); // Silencia los warnings
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Silencia los errores
  });
  
  afterAll(() => {
    console.warn.mockRestore(); // Restaura el comportamiento normal
    console.error.mockRestore();
  });
  

describe("SignUp Component", () => {
    let mockNavigate;

    beforeEach(() => {
        mockNavigate = jest.fn();
        useNavigate.mockReturnValue(mockNavigate);
    });

    test("debe mostrar el formulario de Registro", () => {

        render(
            <Router>
                <SignUp />
            </Router>
        );

        //LABELS
        expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Rol/i)).toBeInTheDocument();
        //PLACEHOLDERS
        expect(screen.getByPlaceholderText(/nombre de usuario/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/nombre@unl.edu.ec/i)).toBeInTheDocument();

        //BUTTONS
        expect(screen.getByRole("button", { name: /registrarme/i })).toBeInTheDocument();
        //SELECT
        expect(screen.getByRole("combobox", { name: /rol/i })).toBeInTheDocument();

        expect(true).toBe(true);
    });


    test("Deberia mostrar una alerta de error si falla el registro", async () => {
        Auth.registerUser.mockRejectedValueOnce(new Error("Error en el registro"));

        render(
            <Router>
                <SignUp />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/nombre de usuario/i), {
            target: { value: "test" },
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "test@gmail.com" },
        });
        fireEvent.change(screen.getByLabelText(/contraseña/i), {
            target: { value: "test" },
        });
        fireEvent.change(screen.getByLabelText(/rol/i), {
            target: { value: 1 },
        });

        fireEvent.click(screen.getByRole("button", { name: /registrarme/i }));

        await waitFor(() => expect(screen.getByText(/¡Error al registrar el usuario!/i)).toBeInTheDocument());
    });

    test("Deberia redirigir al usuario a la pagina de login si el registro es exitoso", async () => {
        const mockUser = {
            username: "test",
            email: "test@gmail.com",
            password: "test",
            rol: 1
        }



        Auth.registerUser.mockResolvedValueOnce(mockUser);
        Auth.getUserWithRole.mockResolvedValueOnce({ rol: { tipoRol: "estudiante" } });

        render(
            <Router>
                <SignUp />
            </Router>
        );

        fireEvent.change(screen.getByLabelText(/nombre de usuario/i), {
            target: { value: "test" },
        });

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "test@gmail.com" },
        });

        fireEvent.change(screen.getByLabelText(/contraseña/i), {
            target: { value: "test" },
        });

        fireEvent.change(screen.getByLabelText(/rol/i), {
            target: { value: "1" },
        });

        fireEvent.click(screen.getByRole("button", { name: /registrarme/i }));

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
        expect(true).toBe(true);

    });

    test("deberia obtener los roles de la base de datos", async () => {
        const mockRoles = [
            { id: 1, attributes: { tipoRol: "estudiante" } },
            { id: 2, attributes: { tipoRol: "tutor" } },
        ];

        // Asegúrate de que getRoles esté siendo mockeada correctamente
        Auth.getRoles.mockResolvedValueOnce({ data: mockRoles });

        render(
            <Router>
                <SignUp />
            </Router>
        );

        // Espera a que se carguen los roles
        await waitFor(() => {
            expect(screen.getByText(/estudiante/i)).toBeInTheDocument();
            expect(screen.getByText(/tutor/i)).toBeInTheDocument();
        });

        // También puedes verificar que el select tenga las opciones correctas
        const select = screen.getByRole("combobox");
        const options = select.querySelectorAll("option");

        // Verifica que hay dos opciones además de la opción "Seleccione una opción"
        expect(options).toHaveLength(3); // 1 opción por defecto + 2 roles
    });

});