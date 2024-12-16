import axios from 'axios';
import { API_URL } from './config';
import { decryptData } from '../utils/encryption';

// Resto de tu código
//const API_URL = "http://localhost:1337";

//METODO PARA SUBIR DOCUMENTO
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("files", file);

  let token = null; 

  const encryptedToken = localStorage.getItem("jwtToken");

  if (encryptedToken) {
    // Desencriptar los datos
    const decryptedToken = decryptData(encryptedToken);

    // Acceder al rol desde los datos desencriptados
    token = decryptedToken;

  } else {
    console.log("No se encontró el userData en localStorage");
  }

  if (!token) {
    throw new Error("Token JWT no encontrado");
  }

  const response = await axios.post(
    `${API_URL}/api/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`, // Añadir el token en los headers
      },
    }
  );

  return response.data[0]; // Retorna el primer archivo subido
};

// MÉTODO PARA AGREGAR EL DOCUMENTO AL PROYECTO
export const createDocument = async (title, fileId, projectId) => {
  const numProjectId = parseInt(projectId, 10);

  // Validación adicional
  if (!projectId) {
    throw new Error("Se requiere un ID de proyecto válido");
  }


  const documentData = {
    data: {
      title: title,
      documentFile: [fileId],
      project: numProjectId,
      isRevised: false,
    },
  };

  if (isNaN(numProjectId)) {
    throw new Error("ID de proyecto no es válido");
  }

  try {
    const response = await axios.post(
      `${API_URL}/api/documents`,
      documentData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response || !response.data || !response.data.data) {
      throw new Error(
        "Error inesperado al crear el documento. Estructura de respuesta inválida."
      );
    }

    const document = response.data;
    const documentoId = response.data.data.id;

    await createNotification(title, projectId, documentoId);
    
    return document;
  } catch (error) {
    handleError(error);
  }
};

// MÉTODO PARA CREAR UNA NOTIFICACIÓN
const createNotification = async (title, projectId, documentoId) => {
  try {
    const projectResponse = await axios.get(
      `${API_URL}/api/projects/${projectId}?populate=tutor`
    );


    if (
      !projectResponse ||
      !projectResponse.data ||
      !projectResponse.data.data
    ) {
      throw new Error(
        "Error inesperado al obtener el proyecto. Estructura de respuesta inválida."
      );
    }

    const projectAttributes = projectResponse.data.data.attributes;
    const tutor = projectAttributes.tutor.data;
    const proyecto = projectAttributes.title

    if (tutor) {
      const notificationData = {
        data: {
          message: `En el proyecto ${proyecto} se ha subido un nuevo documento: ${title}`,
          tutor: tutor.id,
          document: documentoId,
          isRead: false,
        },
      };

      await axios.post(`${API_URL}/api/notifications`, notificationData);
    }
  } catch (error) {
    handleError(error);
  }
};

// MÉTODO PARA MANEJAR ERRORES
const handleError = (error) => {
  if (error.response) {
    console.error("Error de respuesta:", error.response.data);
  } else if (error.request) {
    console.error("Error en la solicitud:", error.request);
  } else {
    console.error("Error:", error.message);
  }
};

// Obtener documentos por ID del proyecto
export const getDocumentsByProjectId = async (projectId) => {
  try {
    // Utiliza la sintaxis correcta para aplicar el filtro
    const response = await axios.get(
      `${API_URL}/api/documents?filters[project][id][$eq]=${projectId}&populate=*`
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error al obtener los documentos:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getDocumentById = async (documentId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/documents/${documentId}?populate=*`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
};