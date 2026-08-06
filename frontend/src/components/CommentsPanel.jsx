import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Check, GraduationCap, MessageSquare, Pencil, Trash2, X } from "lucide-react";
import { updateComment, deleteComment } from "../core/Comments";
import { confirmAlert, errorAlert, successAlert } from "./Alerts/Alerts";
import { usePermission } from "../context/PermissionContext";
import Button from "./ui/Button";
import { Textarea } from "./ui/Input";
import EmptyState from "./ui/EmptyState";
import { formatDateTime, initialsOf } from "../utils/format";

/** "hace 5 min", "ayer"... Para fechas lejanas cae a la fecha completa. */
const relativeTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;

  return formatDateTime(value);
};

const authorOf = (comment) =>
  comment.attributes.correctionTutor?.data?.attributes?.username ?? "Tutor";

const CommentCard = ({ comment, isSelected, canManage, onSelect, onUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.attributes.correction);
  const [isSaving, setIsSaving] = useState(false);

  const author = authorOf(comment);
  const { correction, quote, createdAt, updatedAt } = comment.attributes;
  const wasEdited = updatedAt && createdAt && updatedAt !== createdAt;

  const handleSave = async () => {
    if (!draft.trim()) return;

    setIsSaving(true);
    try {
      await updateComment(comment.id, draft);
      await onUpdated();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating comment", error);
      errorAlert("No se pudo guardar el comentario");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmAlert(
      "¿Eliminar el comentario?",
      "Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    try {
      await deleteComment(comment.id);
      await onUpdated();
      successAlert("El comentario ha sido eliminado.");
    } catch (error) {
      console.error("Error deleting comment", error);
      errorAlert("Error al eliminar el comentario");
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      onClick={() => !isEditing && onSelect(comment)}
      className={[
        "group cursor-pointer rounded-xl border bg-surface p-3 transition-colors",
        isSelected
          ? "border-accent shadow-card ring-1 ring-accent"
          : "border-line hover:border-line-strong",
      ].join(" ")}
    >
      <header className="mb-2 flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-wash font-mono text-[11px] font-medium text-accent">
          {initialsOf(author)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight text-content">{author}</p>
          <p className="font-mono text-[11px] leading-tight text-muted">
            {relativeTime(createdAt)}
            {wasEdited && " · editado"}
          </p>
        </div>

        {canManage && !isEditing && (
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              title="Editar"
              onClick={(event) => {
                event.stopPropagation();
                setDraft(correction);
                setIsEditing(true);
              }}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-content"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              title="Eliminar"
              onClick={(event) => {
                event.stopPropagation();
                handleDelete();
              }}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger-wash hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </div>
        )}
      </header>

      {quote && (
        <p className="mb-2 border-l-2 border-accent bg-accent-wash px-2.5 py-1.5 text-xs italic leading-relaxed text-muted">
          {quote}
        </p>
      )}

      {isEditing ? (
        <div
          className="flex flex-col gap-2"
          onClick={(event) => event.stopPropagation()}
          role="presentation"
        >
          <Textarea
            id={`comment-${comment.id}`}
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} loading={isSaving}>
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        // El icono deja claro de un vistazo que lo que sigue es la indicación
        // del tutor sobre qué hay que mejorar, y no una nota cualquiera.
        <div className="flex gap-2">
          <GraduationCap
            className="mt-0.5 h-4 w-4 shrink-0 text-accent"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-content">{correction}</p>
        </div>
      )}
    </motion.article>
  );
};

CommentCard.propTypes = {
  comment: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  canManage: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onUpdated: PropTypes.func.isRequired,
};

/**
 * Panel lateral de correcciones.
 *
 * Se apoya en la convención de los editores colaborativos: el documento manda y
 * los comentarios viven a su derecha, cada uno con su autor y anclado a la cita
 * que corrige. Pulsar uno lleva al resaltado correspondiente.
 */
const CommentsPanel = ({
  comments = [],
  onUpdateComments,
  onCommentClick,
  selectedCommentId,
}) => {
  const { hasPermission } = usePermission();
  const canManageComments = hasPermission("MANAGE_COMMENTS");

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-3">
        <MessageSquare className="h-4 w-4 text-muted" strokeWidth={1.8} />
        <h2 className="font-display text-sm font-semibold text-content">Comentarios</h2>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs tabular text-muted">
          {comments.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {comments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Sin comentarios"
            description="Selecciona un fragmento del documento para dejar la primera corrección."
          />
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isSelected={comment.id === selectedCommentId}
              canManage={canManageComments}
              onSelect={onCommentClick}
              onUpdated={onUpdateComments}
            />
          ))
        )}
      </div>
    </div>
  );
};

CommentsPanel.propTypes = {
  comments: PropTypes.array,
  onUpdateComments: PropTypes.func,
  onCommentClick: PropTypes.func,
  selectedCommentId: PropTypes.number,
};

export default CommentsPanel;
