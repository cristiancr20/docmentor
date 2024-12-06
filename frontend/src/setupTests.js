import 'jest-localstorage-mock';
import '@testing-library/jest-dom';
// jest.setup.js
import dotenv from 'dotenv';

// Carga las variables de entorno desde el archivo .env.local
dotenv.config({ path: '.env.local' });
