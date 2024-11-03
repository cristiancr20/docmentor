import axios from "axios";

import { API_URL } from "./config";

export const addCommentToDocument = async (
  documentId,
  newComment,
  tutorId,
  highlightAreas,
  quote
) => {
  try {
    const response = await fetch(`${API_URL}/api/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          correccion: newComment,
          correccionTutor: tutorId,
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

    const result = await response.json();

    // Actualizar el estado del documento para indicar que ha sido revisado
    const updateResponse = await fetch(
      `${API_URL}/api/documents/${documentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            revisado: true, // Cambia esto por el campo que estás utilizando para representar el estado del comentario
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(
        `HTTP error during document update! status: ${updateResponse.status}`
      );
    }

    const updateResult = await updateResponse.json();

    return result;
  } catch (error) {
    console.error("Error adding comment:", error.message);
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
          correccion: newContent, // Solo actualiza el campo "correccion"
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