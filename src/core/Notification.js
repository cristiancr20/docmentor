import axios from "axios";


export const getNotifications = async (token) => {
  try {
    const response = await axios.get('http://localhost:1337/api/notificacions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error al cargar las notificaciones:', error.response || error.message);
    throw error;  // Propaga el error para manejarlo en el componente
  }
};

