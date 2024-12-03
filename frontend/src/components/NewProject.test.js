import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewProject from './NewProject';
import { createProject, getTutors, getUserByEmail, getUserById } from '../core/Projects';

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

  test('allows individual project creation', async () => {
    createProject.mockResolvedValue({});

    render(<NewProject onClose={mockOnClose} fetchProjects={mockFetchProjects} />);
    
    await userEvent.type(screen.getByLabelText(/título del proyecto/i), 'Test Project');
    await userEvent.type(screen.getByLabelText(/descripción del proyecto/i), 'Test Description');
    
    // Seleccionar tutor
    await userEvent.selectOptions(
      screen.getByLabelText(/seleccionar tutor/i),
      '1'
    );

    // Seleccionar itinerario
    await userEvent.selectOptions(
      screen.getByLabelText(/seleccionar itinerario/i),
      'Ingeniería de Software'
    );

    await userEvent.click(screen.getByText(/crear proyecto/i));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith(expect.objectContaining({
        Title: 'Test Project',
        Descripcion: 'Test Description',
        tutor: 1,
        estudiantes: ['123'],
        tipoProyecto: 'Individual'
      }));
    });
  });

  test('allows group project creation', async () => {
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
  });
});