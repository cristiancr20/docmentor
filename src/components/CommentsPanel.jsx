import React, { useState } from "react";

import { updateComment, deleteComment } from "../core/Comments";
import Swal from "sweetalert2";
import { FaPen } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { motion } from "framer-motion";

const CommentsPanel = ({ comments = [], onUpdateComments }) => {
  const rol = localStorage.getItem("rol");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [updatedContent, setUpdatedContent] = useState("");

  const handleEditClick = (comment) => {
    setEditingCommentId(comment.id);
    setUpdatedContent(comment.attributes.correccion);
  };

  const handleEditSubmit = async (commentId) => {
    try {
      await updateComment(commentId, updatedContent);
      onUpdateComments();
      setEditingCommentId(null);
    } catch (error) {
      console.error("Error updating comment", error);
    }
  };

  const handleDeleteClick = async (commentId) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar!",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteComment(commentId);
          onUpdateComments();
          Swal.fire(
            "Eliminado!",
            "El comentario ha sido eliminado.",
            "success"
          );
        } catch (error) {
          console.error("Error deleting comment", error);
          Swal.fire(
            "Error!",
            "Hubo un problema al eliminar el comentario.",
            "error"
          );
        }
      }
    });
  };

  return (
    <div className="comments-panel bg-gray-100 p-4 rounded ">
      <h3 className="text-lg font-bold mb-4">Comentarios</h3>
      <div className="p-4 bg-gray-900 rounded-lg shadow-md">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-base">No hay comentarios</p>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              key={comment.id}
              className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition ease-in-out duration-150"
            >
              {editingCommentId === comment.id ? (
                <div>
                  <textarea
                    value={updatedContent}
                    onChange={(e) => setUpdatedContent(e.target.value)}
                    className="w-full p-2 mb-2 border rounded"
                  />

                  <button
                    onClick={() => handleEditSubmit(comment.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingCommentId(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="bg-white shadow-md rounded-lg p-4 mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-gray-800 text-base">
                      <strong className="font-semibold">Comentario:</strong>{" "}
                      {comment.attributes.correccion}
                    </p>
                    {comment.attributes.quote && (
                      <p className="text-gray-600 text-sm mt-1 italic border-l-4 border-gray-300 pl-2">
                        <strong className="font-semibold">
                          Texto seleccionado:
                        </strong>{" "}
                        {comment.attributes.quote}
                      </p>
                    )}

                    <p className="text-gray-600 text-sm mt-1">
                      <strong className="font-semibold">Fecha de Creación:</strong>{" "}
                      <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700">
                        {new Date(
                          comment.attributes.createdAt
                        ).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>

                    <p className="text-gray-600 text-sm mt-1">
                      <strong className="font-semibold">Fecha de Modificación:</strong>{" "}
                      <span className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-50 text-yellow-700 ">
                        {new Date(
                          comment.attributes.updatedAt
                        ).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>

                  {rol === "tutor" && (
                    <div className="flex space-x-4 ml-4">
                      <button
                        onClick={() => handleEditClick(comment)}
                        className="text-yellow-500 hover:text-yellow-600 bg-gray-900 p-2 rounded-lg flex items-center justify-center w-12 h-12"
                        title="Editar"
                      >
                        <FaPen size={24} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(comment.id)}
                        className="text-red-500 hover:text-red-600 bg-gray-900 p-2 rounded-lg flex items-center justify-center w-12 h-12"
                        title="Eliminar"
                      >
                        <MdDelete size={24} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsPanel;
