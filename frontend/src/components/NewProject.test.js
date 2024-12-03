import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewProject from './NewProject';
import { createProject, getTutors, getUserByEmail, getUserById } from '../core/Projects';
import 'jest-localstorage-mock';


// Mock de las dependencias externas
jest.mock('../core/Projects', () => ({
    createProject: jest.fn(),
    getTutors: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserById: jest.fn()
}));

jest.mock('./Alerts/Alerts', () => ({
    successAlert: jest.fn(),
    errorAlert: jest.fn()
}));

describe('NewProject Component', () => {
    const mockOnClose = jest.fn();
    const mockFetchProjects = jest.fn();

    beforeEach(() => {
        // Simular localStorage con datos de usuario
        localStorage.setItem('userData', JSON.stringify({ id: '123' }));

        // Mockear getTutors
        getTutors.mockResolvedValue([
            { id: 1, username: 'Tutor 1' },
            { id: 2, username: 'Tutor 2' }
        ]);
    });

    afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('renders project creation form', async () => {
        render(<NewProject onClose={mockOnClose} fetchProjects={mockFetchProjects} />);

        expect(screen.getByLabelText(/título del proyecto/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/descripción del proyecto/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/seleccionar tutor/i)).toBeInTheDocument();
    });

    /* test('allows individual project creation', async () => {
        createProject.mockResolvedValue({});

        render(<NewProject onClose={mockOnClose} fetchProjects={mockFetchProjects} />);

        // Esperar que los tutores se hayan cargado y las opciones estén disponibles
        await waitFor(() => {
            expect(screen.getByLabelText(/seleccionar tutor/i)).toHaveTextContent('Tutor 1');
            expect(screen.getByLabelText(/seleccionar tutor/i)).toHaveTextContent('Tutor 2');
        });

        // Rellenar formulario
        await userEvent.type(screen.getByLabelText(/título del proyecto/i), 'Test Project');
        await userEvent.type(screen.getByLabelText(/descripción del proyecto/i), 'Test Description');

        // Esperar a que los tutores se hayan cargado y que el select tenga las opciones
        const tutorSelect = screen.getByLabelText(/seleccionar tutor/i);
        await waitFor(() => expect(tutorSelect.children.length).toBeGreaterThan(1)); // Verifica que haya opciones

        // Seleccionar tutor
        await userEvent.selectOptions(tutorSelect, '1'); // Asegúrate de que el valor coincida con el que deseas seleccionar

        // Esperar y seleccionar itinerario
        const itinerarioSelect = screen.getByLabelText(/seleccionar itinerario/i);
        await userEvent.selectOptions(itinerarioSelect, 'Ingeniería de Software');

        // Hacer clic en el botón para crear el proyecto
        await userEvent.click(screen.getByText(/crear proyecto/i));
        await userEvent.selectOptions(itinerarioSelect, 'Ingeniería de Software');



        // Esperar a que se haya llamado a la función createProject
        await waitFor(() => {
            expect(createProject).toHaveBeenCalledWith(expect.objectContaining({
                Title: 'Test Project',
                Descripcion: 'Test Description',
                tutor: 1,  // Verifica si el valor de tutor es un número o un string
                estudiantes: ['123'],
                tipoProyecto: 'Individual'
            }));
        });
    }); */


    /*   test('allows group project creation', async () => {
        getUserByEmail.mockResolvedValue([{ id: '456' }]);
        getUserById.mockResolvedValue({ 
          id: '456', 
          username: 'Partner User', 
          email: 'partner@test.com' 
        });
        createProject.mockResolvedValue({});
    
        render(<NewProject onClose={mockOnClose} fetchProjects={mockFetchProjects} />);
        
        // Switch to group project
        await userEvent.click(screen.getByLabelText(/en pareja/i));
        
        // Add project details
        await userEvent.type(screen.getByLabelText(/título del proyecto/i), 'Group Project');
        await userEvent.type(screen.getByLabelText(/descripción del proyecto/i), 'Group Description');
        
        // Add partner email
        await userEvent.type(screen.getByLabelText(/correo del compañero/i), 'partner@test.com');
        
        // Click add partner
        await userEvent.click(screen.getByText(/agregar compañero/i));
        
        // Select tutor and itinerary
        await userEvent.selectOptions(
          screen.getByLabelText(/seleccionar tutor/i),
          '1'
        );
        await userEvent.selectOptions(
          screen.getByLabelText(/seleccionar itinerario/i),
          'Sistemas Inteligentes'
        );
    
        await userEvent.click(screen.getByText(/crear proyecto/i));
    
        await waitFor(() => {
          expect(createProject).toHaveBeenCalledWith(expect.objectContaining({
            Title: 'Group Project',
            Descripcion: 'Group Description',
            tutor: 1,
            estudiantes: ['123', '456'],
            tipoProyecto: 'Grupal'
          }));
        });
      });  */
});