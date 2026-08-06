import React, { useState } from "react";
import { updateComment, deleteComment } from "../core/Comments";
import Swal from "sweetalert2";
import { ChevronDown, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import { errorAlert, successAlert } from "./Alerts/Alerts";
import { usePermission } from "../context/PermissionContext";
import Button from "./ui/Button";
import { Textarea } from "./ui/Input";
import EmptyState from "./ui/EmptyState";
import { formatDateTime } from "../utils/format";

const CommentsPanel = ({ comments = [], onUpdateComments, onCommentClick }) => {
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [updatedContent, setUpdatedContent] = useState("");
  const [isDropdownOpenComments, setIsDropdownOpenComments] = useState(true);

  const { hasPermission } = usePermission();
  const canManageComments = hasPermission("MANAGE_COMMENTS");

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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-content">Comentarios</h2>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs tabular text-muted">
            {comments.length}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDropdownToggleComments}
          aria-expanded={isDropdownOpenComments}
        >
          {isDropdownOpenComments ? "Ocultar" : "Ver comentarios"}
          <motion.span
            animate={{ rotate: isDropdownOpenComments ? 180 : 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            <ChevronDown className="h-4 w-4" strokeWidth={1.8} />
          </motion.span>
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isDropdownOpenComments && (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {comments.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No hay comentarios"
                description="Selecciona texto en el documento para dejar la primera corrección."
              />
            ) : (
              comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                  onClick={() => onCommentClick(comment)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onCommentClick(comment);
                    }
                  }}
                >
                  {editingCommentId === comment.id ? (
                    <div
                      className="flex flex-col gap-3"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      role="presentation"
                    >
                      <Textarea
                        label="Corrección"
                        id={`comment-${comment.id}`}
                        rows={3}
                        value={updatedContent}
                        onChange={(e) => setUpdatedContent(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditSubmit(comment.id)}>
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-content">{comment.attributes.correction}</p>

                      {comment.attributes.quote && (
                        <p className="border-l-2 border-accent bg-accent-wash px-3 py-2 text-sm italic text-muted">
                          {comment.attributes.quote}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5 font-mono text-xs text-muted">
                          <span>Creado: {formatDateTime(comment.attributes.createdAt)}</span>
                          <span>
                            Modificado: {formatDateTime(comment.attributes.updatedAt)}
                          </span>
                        </div>

                        {canManageComments && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditClick(comment);
                              }}
                              className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-content"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.8} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteClick(comment.id);
                              }}
                              className="rounded-lg p-2 text-danger transition-colors hover:bg-danger-wash"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        )}
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
  );
};

CommentsPanel.propTypes = {
  comments: PropTypes.array,
  onUpdateComments: PropTypes.func,
  onCommentClick: PropTypes.func,
};

export default CommentsPanel;
