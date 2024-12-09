import { render, screen } from "@testing-library/react";
import Navbar from "./Navbar"; // Ruta de tu componente
import { BrowserRouter as Router, Link } from "react-router-dom";

beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { }); // Silencia los warnings
    jest.spyOn(console, 'error').mockImplementation(() => { }); // Silencia los errores
});

afterAll(() => {
    console.warn.mockRestore(); // Restaura el comportamiento normal
    console.error.mockRestore();
});

// Simulación de los datos del usuario
/* const mockUserData = {
    username: "John Doe",
    email: "john@example.com",
    rol: "tutor" // o "estudiante" dependiendo del rol que quieras probar
}; */

describe("Navbar Component", () => {
    // Simulamos `localStorage` para que no genere advertencias
    beforeEach(() => {
        // Mocking localStorage
        Storage.prototype.getItem = jest.fn(() => "fakeToken"); // Simula un token en el localStorage
    });



    //Ver el renderizado del navbar en diferentes tamaños
    test("should render DocMentor and DocM based on screen size", () => {
        render(
            <Router>
                <Navbar />
            </Router>
        );

        // Verificar que ambos textos 'DocM' y 'DocMentor' están en el documento
        const docmElements = screen.getAllByText(/docm/i);
        expect(docmElements).toHaveLength(2); // Debe haber dos elementos

        // Verificar que DocM aparece solo en pantallas pequeñas
        expect(docmElements[0]).toBeInTheDocument(); // 'DocM' visible en pantallas pequeñas
        expect(docmElements[0]).toHaveClass("block"); // 'DocM' tiene la clase 'block' en pantallas pequeñas
        expect(docmElements[0]).not.toHaveClass("hidden"); // 'DocM' no debe tener la clase 'hidden'


    });

/*     test("renders tutor links when user role is 'tutor'", () => {
        const mockUserData = { rol: "tutor" }; // Simulación de los datos del usuario

        render(
            <Router>
                <Navbar userData={mockUserData} />
            </Router>
        );

        // Verifica los li enlaces de tutor
        if(mockUserData.rol === "tutor"){
            expect(screen.getAllByText(/inicio/i)).toBeInTheDocument();
        }
    });
 */

});


