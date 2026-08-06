import api from "./apiClient";

// MÉTODO PARA AGREGAR COMENTARIO AL DOCUMENTO
export const addCommentToDocument = async (
  documentId,
  newComment,
  tutorId,
  highlightAreas,
  quote
) =>
  // Solo se publica el comentario. Antes, acto seguido, se marcaba el documento
  // como pendiente con un PUT genérico que exige UPDATE_DOCUMENT: un tutor no
  // lo tiene, recibía 403 y la excepción impedía refrescar la vista, así que el
  // comentario quedaba guardado pero invisible hasta recargar. Ahora esa regla
  // la aplica el backend al crear el comentario.
  postComment(documentId, newComment, tutorId, highlightAreas, quote);

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

// Marca la versión como revisada. Va por la ruta de revisión, que exige
// REVIEW_DOCUMENT; el PUT genérico al documento pedía UPDATE_DOCUMENT y
// devolvía 403 al tutor.
export const updateDocumentStatusRevisado = async (documentId) => {
  const response = await api.put(`/api/documents/${documentId}/review`, {
    data: { isRevised: true },
  });

  return response.data;
};

// Se pide también el autor de cada corrección: el panel lo muestra junto al
// comentario, y con `populate=comments` a secas la relación no venía.
export const getCommentsByDocument = async (documentId) => {
  const response = await api.get(`/api/documents/${documentId}`, {
    params: { "populate[comments][populate][0]": "correctionTutor" },
  });

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
