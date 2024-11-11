import axios from "axios";

import { API_URL } from "./config";
//const API_URL = "http://localhost:1337";

//METODO PARA SUBIR DOCUMENTO
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("files", file);

  const token = localStorage.getItem("jwtToken"); // Obtener el token

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
  console.log('Ambiente actual:', process.env.NODE_ENV);
  console.log('API URL en uso:', API_URL);

  const documentData = {
    data: {
      title: title,
      documentFile: [fileId], // Asegúrate de que 'documentFile' es un array si Strapi lo requiere así
      project: projectId, // Enviar el ID del proyecto directamente
      fechaSubida: new Date().toISOString(), // Fecha de subida
      revisado: false, // Estado inicial
    },
  };

   console.log("Intentando crear documento en:", `${API_URL}/api/documents`);
  console.log("Con datos:", documentData);

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

    const documentoId = response.data.data.id;

    // Verificar la respuesta del documento
    if (!response || !response.data || !response.data.data) {
      throw new Error(
        "Error inesperado al crear el documento. Estructura de respuesta inválida."
      );
    }

    const document = response.data;

    // Obtener el proyecto para identificar al tutor asociado
    const projectResponse = await axios.get(
      `${API_URL}/api/new-projects/${projectId}?populate=tutor,estudiante`
    );

    // Verificar la respuesta del proyecto
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
    const student = projectAttributes.estudiante.data;

    if (tutor && student) {
      // Crear la notificación para el tutor con el nombre del estudiante
      const notificationData = {
        data: {
          mensaje: `El estudiante ${student.attributes.username} ha subido un nuevo documento: ${title}`,
          tutor: tutor.id, // ID del tutor
          document: documentoId, // ID del documento recién creado
          leido: false, // Inicialmente no leída
        },
      };

      await axios.post(
        `${API_URL}/api/notificacions`,
        notificationData
      );
    }

    return document;
  } catch (error) {
    if (error.response) {
      // La solicitud se realizó y el servidor respondió con un código de estado
      // que no está en el rango de 2xx
      console.error("Error de respuesta:", error.response.data);
    } else if (error.request) {
      // La solicitud se realizó pero no hubo respuesta
      console.error("Error en la solicitud:", error.request);
    } else {
      // Algo sucedió al configurar la solicitud que lanzó un Error
      console.error("Error:", error.message);
    }
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

// Función para eliminar un documento
export const deleteDocument = async (documentId) => {
  try {
    // Primero, obtenemos las notificaciones asociadas al documento
    const notificationsResponse = await axios.get(`${API_URL}/api/notificacions`, {
      params: {
        'filters[document][id][$eq]': documentId,
      },
    });

    const notifications = notificationsResponse.data.data;

    // Eliminamos las notificaciones asociadas
    for (const notification of notifications) {
      await axios.delete(`${API_URL}/api/notificacions/${notification.id}`);
    }

    // Ahora eliminamos el documento
    await axios.delete(`${API_URL}/api/documents/${documentId}`);

  } catch (error) {
    console.error('Error eliminando el documento o las notificaciones:', error.response || error.message);
  }
};