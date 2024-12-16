import axios from "axios";
import { API_URL } from "./config";

// Configurar axios para que incluya cookies en cada solicitud
/* axios.defaults.withCredentials = true; */


//METODO PARA REGISTRAR UN USUARIO
export const registerUser = async (data) => {
  console.log("data", data);
  try {
    const response = await axios.post(`${API_URL}/api/auth/local/register`, data);
    console.log("response", response.data);
    return response.data;
  } catch (error) {
    // Si hay un error, lo vuelves a lanzar para que pueda ser manejado en el componente
    console.error("Error en el registro de usuario:", error);
    throw error; // Re-lanza el error para capturarlo en el componente
  }
};


export const login = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/local`, data, {

    });
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
    const response = await axios.get(`${API_URL}/api/users/${userId}?populate=rol`);
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



