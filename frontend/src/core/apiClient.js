import axios from "axios";
import { API_URL } from "./config";
import { decryptData } from "../utils/encryption";

/**
 * Cliente HTTP único de la aplicación.
 *
 * Antes cada módulo de `core/` armaba sus peticiones por su cuenta: cuatro
 * implementaciones distintas de las cabeceras de autenticación, mezcla de axios
 * y fetch, y la mayoría de las llamadas sin token. Eso funcionaba solo porque
 * el backend tenía los endpoints abiertos; al cerrarlos, todas esas llamadas
 * pasarían a 401/403.
 *
 * El interceptor adjunta el JWT a cada petición, así que ningún módulo tiene
 * que acordarse de hacerlo.
 */

export const getAuthToken = () => {
  const encryptedToken = localStorage.getItem("jwtToken");
  if (!encryptedToken) return null;
  return decryptData(encryptedToken);
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
