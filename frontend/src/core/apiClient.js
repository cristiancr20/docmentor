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

// Endpoints públicos de autenticación. Mandarles una cabecera Authorization es
// contraproducente: Strapi valida el token antes de mirar las credenciales, así
// que un token caducado o firmado con un secreto anterior hace que el propio
// login responda 401/403 y el usuario quede sin forma de volver a entrar.
const PUBLIC_AUTH_PATHS = ["/api/auth/local", "/api/auth/local/register"];

const isPublicAuthRequest = (url = "") =>
  PUBLIC_AUTH_PATHS.some((path) => url.startsWith(path));

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config.url)) {
    delete config.headers.Authorization;
    return config;
  }

  // Si quien llama ya puso su propia cabecera, se respeta. Durante el login el
  // token recién emitido se pasa a mano porque todavía no está guardado, y
  // pisarlo con el de localStorage (el anterior, ya inválido) hacía fallar la
  // primera petición de la sesión.
  if (config.headers.Authorization) {
    return config;
  }

  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Si el token guardado deja de ser válido (expiró, se rotó el secreto del
 * servidor, o la cuenta se desactivó), la sesión se descarta. Sin esto la
 * aplicación se queda con credenciales muertas: todas las peticiones responden
 * 401 y la interfaz no ofrece salida.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    if (status === 401 && !isPublicAuthRequest(url)) {
      localStorage.removeItem("userData");
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("userPermissions");
      localStorage.removeItem("strapiUserId");
    }

    return Promise.reject(error);
  }
);

export default api;
