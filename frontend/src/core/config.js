//definir process
export const API_URL = process.env?.REACT_APP_API_URL;

export const WORKER_URL = process.env?.REACT_APP_WORKER_URL;

export const SECRET_KEY = process.env?.REACT_APP_SECRET_KEY;

// Validación y logging
if (!API_URL) {
  console.error('API_URL no está definida. Verifica tus archivos .env');
}


