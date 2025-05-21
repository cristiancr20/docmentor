//definir process
export const API_URL = process.env?.REACT_APP_API_URL || "https://docmentor-production.up.railway.app";

export const WORKER_URL = process.env.REACT_APP_WORKER_URL;

export const SECRET_KEY = process.env.REACT_APP_SECRET_KEY ||"4c7b4293c68e4c7b4293c68e4c7b4293c68e4c7b4293c68e4c7b4293c68e4c7b";

// Validación y logging
if (!API_URL) {
  console.error('API_URL no está definida. Verifica tus archivos .env');
}


