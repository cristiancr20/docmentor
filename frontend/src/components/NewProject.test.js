import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react'; // Importa act desde react en lugar de react-dom/test-utils
import NewProject from './NewProject';
import { createProject, getTutors } from '../core/Projects';
import { decryptData, encryptData } from '../utils/encryption';
import 'jest-localstorage-mock';
import '@testing-library/jest-dom'; // Asegúrate de tener esto

jest.mock('../utils/encryption', () => ({
  encryptData: jest.fn((data) => btoa(JSON.stringify(data))),
  decryptData: jest.fn((data) => JSON.parse(atob(data))),
}));

jest.mock('../core/Projects', () => ({
  createProject: jest.fn(),
  getTutors: jest.fn(),
}));

jest.mock('./Alerts/Alerts', () => ({
  successAlert: jest.fn(),
  errorAlert: jest.fn(),
}));

describe('NewProject Component', () => {
  const mockOnClose = jest.fn();
  const mockFetchProjects = jest.fn();

  beforeEach(() => {
    const userData = { id: '123', username: 'TestUser', email: 'test@example.com' };
    localStorage.setItem('userData', encryptData(userData));

    getTutors.mockResolvedValue([
      { id: 1, username: 'Tutor 1' },
      { id: 2, username: 'Tutor 2' },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders project creation form', async () => {
    // Envolvemos la renderización y las actualizaciones en `act`
    await act(async () => {
      render(<NewProject onClose={mockOnClose} fetchProjects={mockFetchProjects} />);
    });

    // Aseguramos que los elementos principales del formulario se renderizan
    await waitFor(() => {
      expect(screen.getByLabelText(/título del proyecto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descripción del proyecto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/seleccionar tutor/i)).toBeInTheDocument();
    });

    // Verificamos que los tutores se renderizan correctamente
    await waitFor(() => {
      expect(screen.getByText('Tutor 1')).toBeInTheDocument();
      expect(screen.getByText('Tutor 2')).toBeInTheDocument();
    });
  });
});
