import api from "./apiClient";

// MÉTODO PARA AGREGAR COMENTARIO AL DOCUMENTO
export const addCommentToDocument = async (
  documentId,
  newComment,
  tutorId,
  highlightAreas,
  quote
) => {
  // Sin re-lanzar, un fallo aquí se tragaba y la vista refrescaba como si el
  // comentario se hubiera guardado.
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
};

// MÉTODO PARA PUBLICAR COMENTARIO
// La autoría (`correctionTutor`) la fija el backend con el usuario del token,
// por eso ya no se manda desde aquí.
const postComment = async (documentId, newComment, tutorId, highlightAreas, quote) => {
  const response = await api.post(`/api/comments`, {
    data: {
      correction: newComment,
      documents: documentId,
      highlightAreas: JSON.stringify(Array.isArray(highlightAreas) ? highlightAreas : []),
      quote,
    },
  });

  return response.data;
};

// MÉTODO PARA ACTUALIZAR EL ESTADO DEL DOCUMENTO
export const updateDocumentStatusRevisado = async (documentId) => {
  const response = await api.put(`/api/documents/${documentId}`, {
    data: { isRevised: true },
  });

  return response.data;
};

const updateDocumentStatusNoRevisado = async (documentId) => {
  const response = await api.put(`/api/documents/${documentId}`, {
    data: { isRevised: false },
  });

  return response.data;
};

export const getCommentsByDocument = async (documentId) => {
  const response = await api.get(`/api/documents/${documentId}?populate=comments`);
  return response.data?.data?.attributes?.comments?.data || [];
};

//Editar comentario
export const updateComment = async (commentId, newContent) => {
  const response = await api.put(`/api/comments/${commentId}`, {
    data: { correction: newContent },
  });

  return response.data;
};

//Eliminar comentario
export const deleteComment = async (commentId) => {
  const response = await api.delete(`/api/comments/${commentId}`);
  return response.data;
};
