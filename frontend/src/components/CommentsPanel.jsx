import React, { useState } from "react";
import { updateComment, deleteComment } from "../core/Comments";
import Swal from "sweetalert2";
import { FaArrowDown, FaPen } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { decryptData } from "../utils/encryption";
import PropTypes from 'prop-types';
import { errorAlert, successAlert } from "./Alerts/Alerts";

const CommentsPanel = ({ comments = [], onUpdateComments, onCommentClick }) => {

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [updatedContent, setUpdatedContent] = useState("");
  const [isDropdownOpenComments, setIsDropdownOpenComments] = useState(true);

  const encryptedUserData = localStorage.getItem("userData");
  let rol = null;

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = JSON.parse(decryptData(encryptedUserData));

    // Acceder al rol desde los datos desencriptados
    rol = decryptedUserData.rol;

  } else {
    console.log("No se encontró el userData en localStorage");
  }

  const handleEditClick = (comment) => {
    setEditingCommentId(comment.id);
    setUpdatedContent(comment.attributes.correction);
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
          const mensaje = "El comentario ha sido eliminado.";
          successAlert(mensaje);
        } catch (error) {
          console.error("Error deleting comment", error);
          const mensaje = "Error al eliminar el comentario";
          errorAlert(mensaje);
        }
      }
    });
  };

  const handleDropdownToggleComments = () => {
    setIsDropdownOpenComments(!isDropdownOpenComments);
  };

  return (
    <div className="comments-panel p-4 rounded">
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          className="flex p-2 items-center space-x-2 bg-gray-800 rounded-lg focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
          onClick={handleDropdownToggleComments}
        >
          <span className="text-white font-bold">Ver Comentarios</span>
          <motion.div
            animate={{ rotate: isDropdownOpenComments ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FaArrowDown className="text-white" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isDropdownOpenComments && (
            <div className="rounded-lg p-2 h-screen ">
              {comments.length === 0 ? (
                <p className="text-gray-900 text-lg text-center font-bold">
                  No hay comentarios
                </p>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    className="m-2 rounded-lg  border transition-all duration-300 cursor-pointer"
                    onClick={() => onCommentClick(comment)}
                  >
                    {editingCommentId === comment.id ? (
                      <div>
                        <textarea
                          value={updatedContent}
                          onChange={(e) => setUpdatedContent(e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                        <div className="flex space-x-2 m-2">
                          <button
                            onClick={() => handleEditSubmit(comment.id)}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="bg-red-500 text-white px-4 py-2 rounded"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-4 ">
                        <div className="flex-grow">
                          <p className="text-gray-800 text-base">
                            <strong className="font-semibold">
                              Comentario:
                            </strong>{" "}
                            {comment.attributes.correction}
                          </p>
                          {comment.attributes.quote && (
                            <p className="text-gray-600 text-sm mt-1 italic border-l-4 border-blue-900 pl-2 bg-blue-50 rounded p-2">
                              <strong className="font-semibold">
                                Texto seleccionado:
                              </strong>{" "}
                              {comment.attributes.quote}
                            </p>
                          )}
                          <div className="date-option grid grid-cols-1 md:grid-cols-2 items-center">
                            <div className="date">
                              <p className="text-gray-600 text-sm mt-1">
                                <strong className="font-semibold">
                                  Fecha de Creación:
                                </strong>{" "}
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
                                <strong className="font-semibold">
                                  Fecha de Modificación:
                                </strong>{" "}
                                <span className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-50 text-yellow-700">
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
                            <div className="option ">
                              {rol === "tutor" && (
                                <div className="flex justify-start gap-2 m-2">
                                  <button
                                    onClick={() => handleEditClick(comment)}
                                    className="text-yellow-500 hover:text-yellow-600 bg-gray-900 p-2 rounded-lg flex items-center justify-center w-12 h-12"
                                    title="Editar"
                                  >
                                    <FaPen size={24} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteClick(comment.id)
                                    }
                                    className="text-red-500 hover:text-red-600 bg-gray-900 p-2 rounded-lg flex items-center justify-center w-12 h-12"
                                    title="Eliminar"
                                  >
                                    <MdDelete size={24} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

CommentsPanel.propTypes = {
  comments: PropTypes.array,
  onUpdateComments: PropTypes.func,
  onCommentClick: PropTypes.func,
};

export default CommentsPanel;
