import axios from "axios";

const API_URL = "http://localhost:1337/api";

//METODO PARA OBTENER LOS ROLES
export const getRoles = async () => {
  try {
    const response = await axios.get(`${API_URL}/rols`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

//METODO PARA REGISTRAR UN USUARIO
export const registerUser = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/local/register`, data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

//METODO PARA SUBIR DOCUMENTO
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('files', file);

  const token = localStorage.getItem('jwtToken'); // Obtener el token

  if (!token) {
    throw new Error('Token JWT no encontrado');
  }

  const response = await axios.post('http://localhost:1337/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`, // Añadir el token en los headers
    },
  });

  return response.data[0]; // Retorna el primer archivo subido
};

// Método para crear la entrada en la entidad 'document'
export const createDocument = async (title, fileId, userId) => {
  const documentData = {
    data: {
      title: title,
      document: [fileId],
      user: userId,
    },
  };

  const token = localStorage.getItem('jwtToken'); // Obtener el token

  if (!token) {
    throw new Error('Token JWT no encontrado');
  }

  const response = await axios.post('http://localhost:1337/api/documents', documentData, {
    headers: {
      'Authorization': `Bearer ${token}`, // Añadir el token en los headers
    },
  });

  return response.data;
};