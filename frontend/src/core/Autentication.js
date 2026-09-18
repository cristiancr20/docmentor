import api from './apiClient';
import logger from '../utils/logger';

// Configurar axios para que incluya cookies en cada solicitud
/* axios.defaults.withCredentials = true; */


//METODO PARA REGISTRAR UN USUARIO
export const registerUser = async (data) =>
  (await api.post(`/api/auth/local/register`, data)).data;


export const login = async (data) =>
  (await api.post(`/api/auth/local`, data)).data;

// Método para obtener el usuario con el rol incluido.
// Requiere el JWT: /api/users ya no es accesible sin sesión.
export const getUserWithRole = async (userId, token) =>
  (
    await api.get(`/api/users/${userId}?populate=rols`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).data;

//buscar id del usuario por el email
// Se conserva el catch: si la búsqueda falla se devuelve null en lugar de
// propagar el error, y DocumentViewer cuenta con ese valor por defecto.
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
