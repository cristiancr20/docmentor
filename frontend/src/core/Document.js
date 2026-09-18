import api from './apiClient';
import logger from '../utils/logger';

// Resto de tu código
//const API_URL = "http://localhost:1337";

//METODO PARA SUBIR DOCUMENTO
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("files", file);

  // El token lo adjunta el interceptor de apiClient.
  const response = await api.post(`/api/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data[0]; // Retorna el primer archivo subido
};

// Función para obtener el documento más reciente del proyecto
const getLastDocument = async (projectId) => {
  try {
    const response = await api.get(`/api/documents`, {
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
    await api.put(`/api/documents/${documentId}`, {
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

  // Cerrojo contra envíos duplicados. Antes se activaba pero no se liberaba
  // nunca (no había `finally`), así que tras la primera subida de la sesión
  // todas las siguientes salían por aquí devolviendo null en silencio mientras
  // la interfaz seguía diciendo "documento subido correctamente".
  if (window.isUploadingDocument) {
    logger.warn("Intento de doble carga detectado, cancelando.");
    return null;
  }
  window.isUploadingDocument = true;

  try {
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


    const response = await api.post(`/api/documents`, documentData);

    if (!response || !response.data || !response.data.data) {
      throw new Error(
        "Error inesperado al crear el documento. Estructura de respuesta inválida."
      );
    }

    // La notificación al tutor la crea el backend en el propio `create` del
    // documento (notifyDocumentUploaded). Hacerlo también aquí duplicaba el
    // aviso y además fallaba con 403: crear notificaciones exige
    // MANAGE_NOTIFICATIONS, que un estudiante no tiene ni debe tener, porque le
    // permitiría fabricar avisos a nombre de otros.
    // Si algo falla el error se propaga: tragárselo hacía que la vista mostrara
    // "documento subido correctamente" aunque la subida hubiera fallado.
    return response.data;
  } finally {
    window.isUploadingDocument = false;
  }
};

/**
 * Restaura una versión anterior creando una nueva al final del historial.
 *
 * Toda la lógica vive en el backend: el número de versión se calcula allí y no
 * se arrastran comentarios ni notificaciones del original.
 */
export const restoreDocumentVersion = async (documentId) => {
  const response = await api.post(`/api/documents/${documentId}/restore`);
  return response.data?.data;
};

// Rutas custom de estado y revisión. El backend lee el body con
// utils/readBody (acepta `{ data: {...} }` o plano), pero desde aquí se envía
// siempre envuelto en `data`, igual que en las rutas core.

/** Marca la versión como revisada (o pendiente). Exige REVIEW_DOCUMENT. */
export const setDocumentReviewed = async (documentId, isRevised = true) => {
  const response = await api.put(`/api/documents/${documentId}/review`, {
    data: { isRevised },
  });

  return response.data;
};

/**
 * Cambia el estado del documento. Las transiciones permitidas las valida el
 * backend (Subido → En Revisión → Aprobado | Cambios Solicitados, ...).
 */
export const changeDocumentStatus = async (documentId, status) => {
  const response = await api.put(`/api/documents/${documentId}/status`, {
    data: { status },
  });

  return response.data;
};

export const copyDocumentAsNewVersion = async (documentId) => {
  try {
    // Obtener el documento original
    const response = await api.get(`/api/documents/${documentId}?populate=*`);
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
    const newResponse = await api.post(`/api/documents`, newDocumentData);

    if (!newResponse || !newResponse.data || !newResponse.data.data) {
      throw new Error("Error al crear la nueva versión.");
    }

    // Actualizar la versión anterior para que ya no sea la actual
    await api.put(`/api/documents/${documentId}`, {
      data: { isCurrent: false },
    });

    return newResponse.data.data;
  } catch (error) {
    // Se conserva el catch: esta función nunca ha propagado el error, devuelve
    // undefined si la copia falla.
    logger.error("Error al copiar documento:", error);
  }
};



// MÉTODO PARA MANEJAR ERRORES (lo usan getLastDocument y markDocumentAsOld,
// que tragan el error y devuelven un valor por defecto)
const handleError = (error) => {
  if (error.response) {
    logger.error("Error de respuesta:", error.response.data);
  } else if (error.request) {
    logger.error("Error en la solicitud:", error.request);
  } else {
    logger.error("Error:", error.message);
  }
};

// Obtener documentos por ID del proyecto
export const getDocumentsByProjectId = async (projectId) =>
  (await api.get(`/api/documents?filters[project][id][$eq]=${projectId}&populate=*`)).data;

export const getDocumentById = async (documentId) =>
  (await api.get(`/api/documents/${documentId}?populate=*`)).data;