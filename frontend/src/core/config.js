const API_URL = process.env.REACT_APP_API_URL;
/* export const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'; */
export const WORKER_URL = process.env.REACT_APP_WORKER_URL;

// Validación y logging
if (!API_URL) {
  console.error('API_URL no está definida. Verifica tus archivos .env');
}

console.log('Ambiente:', process.env.NODE_ENV);
console.log('API URL:', API_URL); 

export { API_URL};