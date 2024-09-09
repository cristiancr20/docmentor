import axios from "axios";

const API_URL = "http://localhost:1337/api";

//METODO PARA REGISTRAR UN USUARIO
export const registerUser = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/auth/local/register`, data);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  };
  
  //METODO PARA OBTENER LOS ROLES
  export const getRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/rols`);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  };
  