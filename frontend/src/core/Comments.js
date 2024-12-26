import axios from "axios";

import { API_URL } from "./config";

// MÉTODO PARA AGREGAR COMENTARIO AL DOCUMENTO
export const addCommentToDocument = async (
  documentId,
  newComment,
  tutorId,
  highlightAreas,
  quote
) => {
  try {
    const commentResponse = await postComment(
      documentId,
      newComment,
      tutorId,
      highlightAreas,
      quote
    );

    // Actualiza el estado del documento a revisado
    const updateResponse = await updateDocumentStatusNoRevisado(documentId);

    return { commentResponse, updateResponse };
  } catch (error) {
    handleError(error);
  }
};

// MÉTODO PARA PUBLICAR COMENTARIO
const postComment = async (
  documentId,
  newComment,
  tutorId,
  highlightAreas,
  quote
) => {
  const response = await fetch(`${API_URL}/api/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        correction: newComment,
        correctionTutor: tutorId,
        document: documentId,
        highlightAreas: JSON.stringify(
          Array.isArray(highlightAreas) ? highlightAreas : []
        ), // Asegúrate de que sea un array
        quote: quote, // Usa el comentario como cita
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// MÉTODO PARA ACTUALIZAR EL ESTADO DEL DOCUMENTO
export const updateDocumentStatusRevisado = async (documentId) => {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        isRevised: true, // Cambia esto por el campo que estás utilizando para representar el estado del comentario
      },
    }),
  });

  if (!response.ok) {
    throw new Error("HTTP error during document update! status: ${response.status}");
  }

  return await response.json();
};

const updateDocumentStatusNoRevisado = async (documentId) => {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        isRevised: false, // Cambia esto por el campo que estás utilizando para representar el estado del comentario
      },
    }),
  });

  if (!response.ok) {
    throw new Error("HTTP error during document update! status: ${response.status}");
  }

  return await response.json();
}


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


export const getCommentsByDocument = async (documentId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/documents/${documentId}?populate=comments`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Asegúrate de que estás accediendo correctamente a los comentarios
    const comments = data?.data?.attributes?.comments?.data || [];
    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};

//Editar comentario
export const updateComment = async (commentId, newContent) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/comments/${commentId}`,
      {
        data: {
          correction: newContent, // Solo actualiza el campo "correccion"
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error al actualizar el comentario:", error);
    throw error;
  }
};

//Eliminar comentario
export const deleteComment = async (commentId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error("Error al eliminar el comentario:", error);
      throw error;
    }
  };