import axios from "axios";



export const getNotifications = async (token) => {
  try {
    const response = await axios.get('http://localhost:1337/api/notificacions?populate=*', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (response.status === 200) {
      console.log("Notificaciones:", response.data.data);
      return response.data.data; // Devuelve los datos de las notificaciones
    } else {
      console.warn(`Error en la respuesta del servidor: ${response.status} ${response.statusText}`);
      return []; // Retorna un array vacío en caso de error no crítico
    }
  } catch (error) {
    if (error.response) {
      // El servidor respondió con un código de estado distinto a 2xx
      console.error('Error del servidor:', error.response.data);
      console.error('Código de estado:', error.response.status);
    } else if (error.request) {
      // La solicitud fue hecha, pero no se recibió respuesta
      console.error('Error de red o sin respuesta del servidor:', error.request);
    } else {
      // Error al configurar la solicitud
      console.error('Error al configurar la solicitud:', error.message);
    }

    throw error;  // Propaga el error para que pueda manejarse en el componente si es necesario
  }
};

