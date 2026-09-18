// URL base del backend Strapi. Sin .env apunta a local para que un entorno
// mal configurado falle contra localhost y no contra un servidor externo.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';
