import axios from "axios";
import jwtDecode from "jwt-decode";
import { API_URL } from "./config";

// Configurar axios para que incluya cookies en cada solicitud
/* axios.defaults.withCredentials = true; */


//METODO PARA REGISTRAR UN USUARIO
export const registerUser = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/local/register`, data);
    return response.data;
  } catch (error) {
    // Si hay un error, lo vuelves a lanzar para que pueda ser manejado en el componente
    console.error("Error en el registro de usuario:", error);
    throw error; // Re-lanza el error para capturarlo en el componente
  }
};


export const login = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/local`, data);
    return response.data;
  } catch (error) {
    // Captura y muestra detalles del error
    console.error("Error en login:", error);
    throw error;  // Para que el error sea capturado en el `handleSubmit`
  }
};

// Método para obtener el usuario con el rol incluido
export const getUserWithRole = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/${userId}?populate=rols`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el usuario con rol:", error);
    throw error;
  }
};

//METODO PARA OBTENER LOS ROLES
export const getRoles = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/rols`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los roles:", error);
    return []; // Devuelve un array vacío en caso de error
  }
};

// Sincronizar usuario con Strapi
export const syncUserWithStrapi = async (token) => {
  try {
    const decoded = jwtDecode(token);
    const email = decoded.email;
    const username = decoded.preferred_username || email.split("@")[0];
    const aerobaseRoles = decoded.realm_access?.roles || [];

    // Obtener roles de Strapi y mapear los IDs
    const roles = await getRoles();
    const strapiRoles = roles.data;
    const roleIds = strapiRoles
      .filter((role) => aerobaseRoles.includes(role.attributes.rolType))
      .map((role) => role.id);

    // Verificar si el usuario existe
    const { data: existingUsers } = await axios.get(
      `${API_URL}/api/users?filters[email][$eq]=${email}`
    );

    if (existingUsers.length > 0) {
      const updatedUser = await assignRolesToStrapiUser(existingUsers[0].id, roleIds);
      return updatedUser;
    }

    // Crear nuevo usuario
    const newUser = {
      email,
      username,
      password: 'contraseñaSegura123',
      rols: roleIds, // Asignar roles directamente en la creación
      isInstitutional: true,
    };
    
    const response = await registerUser(newUser);
    if (!response.user?.id) {
      throw new Error('No se pudo obtener el ID del usuario creado');
    }

    // Asignar roles al usuario creado
/*     const updatedUser = await assignRolesToStrapiUser(response.user.id, roleIds);
    return updatedUser; */
  } catch (error) {
    console.error("❌ Error sincronizando usuario con Strapi:", error.response?.data || error.message);
    throw error;
  }
};

// Asignar roles a un usuario
export const assignRolesToStrapiUser = async (userId, roleIds) => {
  try {
    // Importante: enviar los roles como array
    const response = await axios.put(`${API_URL}/api/users/${userId}`, {
      rols: roleIds, // Aquí está el cambio principal: enviamos el array completo
    });
    return response.data;
  } catch (error) {
    console.error("Error al asignar roles a usuario:", error);
    throw error;
  }
};


//buscar id del usuario por el email
export const getUserByEmail = async (email) => {
  try {
    const response = await fetch(`${API_URL}/api/users?filters[email][$eq]=${email}`);
    const users = await response.json();


    if (users && users.length > 0) {
      return users[0]; // Retorna el primer usuario encontrado
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};
