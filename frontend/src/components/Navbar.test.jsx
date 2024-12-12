import { render, screen } from "@testing-library/react";
import React from "react";
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

    // Tutor sees "Ver mis Proyectos" and "Inicio" links
    // Display "Ver mis Proyectos" and "Inicio" links for tutor role
    /*         it('should display "Ver mis Proyectos" and "Inicio" links for tutor role', () => {
                global.localStorage = {
                  getItem: jest.fn(),
                  setItem: jest.fn(),
                };
          
                const mockToken = 'encrypted.jwt.token24234234';
                const mockUserData = { username: 'test', email: 'test@test.com', rol: 'tutor' };
                const mockDecryptedToken = 'decrypted.jwt.token';
          
                localStorage.setItem('jwtToken', mockToken);
                localStorage.setItem('userData', JSON.stringify(mockUserData));
          
                jest.spyOn(localStorage, 'getItem');
                jest.mock('../utils/encryption', () => ({
                  decryptData: jest.fn((data) => {
                    if (data === mockToken) return mockDecryptedToken;
                    if (data === JSON.stringify(mockUserData)) return mockUserData;
                  }),
                }));
          
                const { getByText } = render(
                    <Router>
                        <Navbar />
                    </Router>
                );
    
                const decryptData = require ('../utils/encryption').decryptData;
          
                expect(localStorage.getItem).toHaveBeenCalledWith('jwtToken');
                expect(localStorage.getItem).toHaveBeenCalledWith('userData');
                //expect(decryptData).toHaveBeenCalledWith(mockToken);
                //expect(decryptData).toHaveBeenCalledWith(mockUserData);
                expect(getByText('Inicio')).toBeInTheDocument();
                expect(getByText('Ver mis Proyectos')).toBeInTheDocument();
              }); */


/*     it('should toggle dropdown visibility when dropdown button is clicked', () => {
        const mockUserData = { username: 'test', email: 'test@test.com', rol: 'tutor' };
        jest.spyOn(React, 'useState').mockImplementation((init) => [init, jest.fn()]);
        jest.spyOn(React, 'useEffect').mockImplementation((f) => f());

        render(
            <Router>
                <Navbar />
            </Router>
        );


        const dropdownButton = screen.getByText((content, element) => 
            element.tagName.toLowerCase() === 'span' && content.startsWith(mockUserData.username)
          );
          fireEvent.click(dropdownButton);
    
          expect(setIsDropdownOpen).toHaveBeenCalledWith(true);
    
          fireEvent.click(dropdownButton);
    
          expect(setIsDropdownOpen).toHaveBeenCalledWith(false);
    }); */
});


