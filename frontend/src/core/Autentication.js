import api from './apiClient';
import logger from '../utils/logger';

// Configurar axios para que incluya cookies en cada solicitud
/* axios.defaults.withCredentials = true; */


//METODO PARA REGISTRAR UN USUARIO
export const registerUser = async (data) => {
  try {
    const response = await api.post(`/api/auth/local/register`, data);
    return response.data;
  } catch (error) {
    // Si hay un error, lo vuelves a lanzar para que pueda ser manejado en el componente
    logger.error("Error en el registro de usuario:", error);
    throw error; // Re-lanza el error para capturarlo en el componente
  }
};


export const login = async (data) => {
  try {
    const response = await api.post(`/api/auth/local`, data);
    return response.data;
  } catch (error) {
    // Captura y muestra detalles del error
    logger.error("Error en login:", error);
    throw error;  // Para que el error sea capturado en el `handleSubmit`
  }
};

// Método para obtener el usuario con el rol incluido.
// Requiere el JWT: /api/users ya no es accesible sin sesión.
export const getUserWithRole = async (userId, token) => {
  try {
    const response = await api.get(`/api/users/${userId}?populate=rols`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    logger.error("Error al obtener el usuario con rol:", error);
    throw error;
  }
};

//buscar id del usuario por el email
export const getUserByEmail = async (email) => {
  try {
    const { data: users } = await api.get(
      `/api/users?filters[email][$eq]=${encodeURIComponent(email)}`
    );

    return users?.length > 0 ? users[0] : null;
  } catch (error) {
    logger.error("Error fetching user by email:", error);
    return null;
  }
};
