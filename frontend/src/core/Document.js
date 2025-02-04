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

// Función para obtener el documento más reciente del proyecto
const getLastDocument = async (projectId) => {
  try {
    const response = await axios.get(`${API_URL}/api/documents`, {
      params: {
        "filters[project][id][$eq]": projectId,
        "sort[0]": "version:desc",
        "pagination[limit]": 1,
      },
    });

    return response.data.data.length > 0 ? response.data.data[0] : null;
  } catch (error) {
    handleError(error);
    return null;
  }
};

// Función para actualizar un documento y marcarlo como no actual
const markDocumentAsOld = async (documentId) => {
  try {
    await axios.put(`${API_URL}/api/documents/${documentId}`, {
      data: {
        isCurrent: false,
      },
    });
  } catch (error) {
    handleError(error);
  }
};

// MÉTODO PARA AGREGAR EL DOCUMENTO AL PROYECTO
export const createDocument = async (title, fileId, projectId) => {
  const numProjectId = parseInt(projectId, 10);
  if (!projectId || isNaN(numProjectId)) {
    throw new Error("Se requiere un ID de proyecto válido");
  }

  try {
    // Bloqueo temporal para evitar duplicados (revisamos si ya hay un documento subiendo)
    if (window.isUploadingDocument) {
      console.warn("Intento de doble carga detectado, cancelando.");
      return null;
    }
    window.isUploadingDocument = true;

    // Obtener el último documento del proyecto
    const lastDocument = await getLastDocument(projectId);
    let previousVersionId = null;
    let newVersionNumber = 1;

    if (lastDocument) {
      previousVersionId = lastDocument.id;
      newVersionNumber = lastDocument.attributes.version + 1;

      // Marcar el documento anterior como no actual
      await markDocumentAsOld(previousVersionId);
    }

    const documentData = {
      data: {
        title: title,
        documentFile: [fileId],
        project: numProjectId,
        isRevised: false,
        isCurrent: true, // Nuevo documento es la versión actual
        version: newVersionNumber,
        //previous_version: previousVersionId, // Relación con la versión anterior
      },
    };

    if (isNaN(numProjectId)) {
      throw new Error("ID de proyecto no es válido");
    }


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

export const copyDocumentAsNewVersion = async (documentId) => {
  try {
    // Obtener el documento original
    const response = await axios.get(`${API_URL}/api/documents/${documentId}?populate=*`);
    if (!response || !response.data || !response.data.data) {
      throw new Error("No se pudo obtener el documento original.");
    }

    const originalDoc = response.data.data;

    // Obtener el proyecto del documento original
    const projectId = originalDoc.attributes.project.data.id;

    // Obtener el último documento del proyecto
    const lastDocument = await getLastDocument(projectId);
    let previousVersionId = null;
    let newVersionNumber = 1;

    if (lastDocument) {
      previousVersionId = lastDocument.id;
      newVersionNumber = lastDocument.attributes.version + 1;

      // Marcar el documento anterior como no actual
      await markDocumentAsOld(previousVersionId);
    }

    // Crear la nueva versión copiando los datos del documento original
    const newDocumentData = {
      data: {
        title: `${originalDoc.attributes.title} (copia)`, // Agrega "(copia)" al título
        documentFile: originalDoc.attributes.documentFile.data.map(file => file.id), // Mantiene el archivo
        project: projectId, // Asigna al mismo proyecto
        isRevised: false, // Se marca como pendiente de revisión
        version: newVersionNumber, // Nueva versión
        isCurrent: true, // Se convierte en la versión actual
        previous_version: documentId, // Se vincula con la versión anterior
        comments: originalDoc.attributes.comments.data.map(comment => comment.id), // Mantiene los comentarios
        notifications: originalDoc.attributes.notifications?.data?.length > 0 ?
          originalDoc.attributes.notifications.data.map(notification => notification.id) : [],
      },
    };

    // Crear la nueva versión en Strapi
    const newResponse = await axios.post(`${API_URL}/api/documents`, newDocumentData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!newResponse || !newResponse.data || !newResponse.data.data) {
      throw new Error("Error al crear la nueva versión.");
    }

    const newDocumentId = newResponse.data.data.id;

    // Actualizar la versión anterior para que ya no sea la actual
    await axios.put(`${API_URL}/api/documents/${documentId}`, {
      data: { isCurrent: false },
    });

    return newResponse.data.data;
  } catch (error) {
    console.error("Error al copiar documento:", error);
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