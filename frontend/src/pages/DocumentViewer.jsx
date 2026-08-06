import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileWarning,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import CommentsPanel from "../components/CommentsPanel";
import { errorAlert, successAlert } from "../components/Alerts/Alerts";
import DisplayNotesSidebarExample from "../components/DisplayNotesSidebarExample.tsx";
import { getDocumentById, getDocumentsByProjectId } from "../core/Document";
import {
  getCommentsByDocument,
  addCommentToDocument,
  updateDocumentStatusRevisado,
} from "../core/Comments.js";
import { API_URL } from "../core/config.js";
import { decryptData } from "../utils/encryption.js";
import { formatDateTime } from "../utils/format";
import { getUserByEmail } from "../core/Autentication.js";
import { usePermission } from "../context/PermissionContext";

const DocumentoViewer = () => {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedHighlightId, setSelectedHighlightId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [strapiUserId, setStrapiUserId] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  const canApproveDocument = hasPermission("APPROVE_DOCUMENT");
  const canComment = hasPermission("COMMENT_DOCUMENT");

  let tutorEmail = null;

  const encryptedUserData = localStorage.getItem("userData");

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = decryptData(encryptedUserData);
    tutorEmail = decryptedUserData.email;
  } else {
    console.log("No se encontró el userData en localStorage");
  }

  useEffect(() => {
    fetchDocument();
    fetchComments();
  }, [documentId]);

  useEffect(() => {
    fetchStrapiUser();
  }, [tutorEmail]);

  const fetchStrapiUser = async () => {
    if (tutorEmail) {
      const user = await getUserByEmail(tutorEmail);
      if (user) {
        setStrapiUserId(user.id);
        localStorage.setItem("strapiUserId", user.id); // Guardarlo si es necesario
      }
    }
  };

  const fetchDocument = async () => {
    try {
      const data = await getDocumentById(documentId);
      setDocument(data);

      // Las demás versiones del mismo proyecto, para poder saltar entre ellas
      // sin volver al detalle del proyecto cada vez.
      const projectId = data?.data?.attributes?.project?.data?.id;
      if (projectId) {
        const response = await getDocumentsByProjectId(projectId);
        const ordered = [...(response?.data ?? [])].sort(
          (a, b) => (a.attributes.version ?? 0) - (b.attributes.version ?? 0)
        );
        setSiblings(ordered);
      }
    } catch (error) {
      setError("Error fetching document details");
    }
  };

  // Va al proyecto, no atrás en el historial: con la navegación entre versiones
  // dentro de la propia página, `navigate(-1)` retrocedía a la versión anterior
  // en lugar de salir al proyecto.
  const handleBackClick = () => {
    const projectId = document?.data?.attributes?.project?.data?.id;

    if (projectId) {
      navigate(`/project/${projectId}`);
    } else {
      navigate(-1);
    }
  };

  // Se selecciona siempre, tenga o no resaltado: así la tarjeta se marca en el
  // panel. Si además hay áreas válidas, el visor salta hasta ellas. Antes, un
  // comentario sin resaltado no daba ninguna señal al pulsarlo.
  const handleCommentClick = (comment) => {
    setSelectedHighlightId(comment.id);
  };

  const fetchComments = async () => {
    try {
      const data = await getCommentsByDocument(documentId);
      setComments(data);

      const notesWithHighlights = data.map((comment) => ({
        id: comment.id,
        content: comment.attributes.correction,
        highlightAreas: JSON.parse(comment.attributes.highlightAreas) || [],
        quote: comment.attributes.quote || "",
      }));
      setNotes(notesWithHighlights);
      return data;
    } catch (error) {
      setError("Error fetching comments");
    }
  };

  const handleAddComment = async (newComment, highlightAreas, quote) => {
    try {
      await addCommentToDocument(
        documentId,
        newComment,
        strapiUserId,
        highlightAreas,
        quote
      );

      await Promise.all([fetchComments(), fetchDocument()]);
      successAlert("Comentario agregado");
    } catch (error) {
      console.error("Error adding comment:", error);
      errorAlert("No se pudo guardar el comentario");
    }
  };

  // Marcar como revisado solo cambiaba la etiqueta de estado, sin ninguna otra
  // señal: no quedaba claro si la acción se había aplicado o no.
  const handleRevisadoClick = async () => {
    setIsSubmitting(true);

    try {
      await updateDocumentStatusRevisado(documentId);
      await fetchDocument();
      successAlert("Documento marcado como revisado");
    } catch (error) {
      console.error("Error updating document status:", error);
      errorAlert("No se pudo actualizar el estado del documento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = (note) => {
    handleAddComment(note.content, note.highlightAreas, note.quote);
  };

  const backButton = (
    <Button variant="secondary" onClick={handleBackClick}>
      <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
      Volver al proyecto
    </Button>
  );

  // Navegación entre versiones sin salir de la vista.
  const currentPosition = siblings.findIndex((doc) => String(doc.id) === String(documentId));
  const previousVersion = currentPosition > 0 ? siblings[currentPosition - 1] : null;
  const nextVersion =
    currentPosition >= 0 && currentPosition < siblings.length - 1
      ? siblings[currentPosition + 1]
      : null;

  const versionNav = siblings.length > 1 && (
    <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
      <button
        type="button"
        disabled={!previousVersion}
        onClick={() => previousVersion && navigate(`/document/${previousVersion.id}`)}
        title={
          previousVersion
            ? `Versión ${previousVersion.attributes.version}`
            : "No hay versión anterior"
        }
        className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-content disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
      </button>

      <span className="px-1 font-mono text-xs text-muted">
        v{document?.data?.attributes?.version ?? "?"} de {siblings.length}
      </span>

      <button
        type="button"
        disabled={!nextVersion}
        onClick={() => nextVersion && navigate(`/document/${nextVersion.id}`)}
        title={
          nextVersion ? `Versión ${nextVersion.attributes.version}` : "No hay versión posterior"
        }
        className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-content disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );

  if (error) {
    return (
      <AppLayout title="Documento" actions={backButton}>
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-line bg-danger-wash px-4 py-3 text-sm text-danger"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
          {error}
        </div>
      </AppLayout>
    );
  }

  if (!document) {
    return (
      <AppLayout title="Documento">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-[86px]" />
            <Skeleton className="h-[86px]" />
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      </AppLayout>
    );
  }

  const { title, publishedAt, isRevised, documentFile } =
    document?.data?.attributes || {};

  const documentUrl = documentFile
    ? `${API_URL}${documentFile.data?.[0]?.attributes?.url}`
    : null;

  if (!documentUrl) {
    return (
      <AppLayout title={title || "Documento"} actions={backButton}>
        <EmptyState
          icon={FileWarning}
          title="No se encontró el archivo del documento"
          description="La versión no tiene un archivo adjunto o se eliminó del servidor."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      fullHeight
      title={title}
      description="Revisa el documento y gestiona las correcciones."
      actions={
        <>
          {versionNav}
          {backButton}
          {canApproveDocument && (
            <Button onClick={handleRevisadoClick} loading={isSubmitting}>
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
              {isSubmitting ? "Actualizando estado..." : "Marcar como revisado"}
            </Button>
          )}
        </>
      }
    >
      {/* Metadatos en una sola franja: antes ocupaban dos tarjetas grandes que
          empujaban el documento fuera de la pantalla. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="mb-4 flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm text-muted">
          <Calendar className="h-4 w-4" strokeWidth={1.8} />
          <span className="font-mono text-xs">{formatDateTime(publishedAt)}</span>
        </span>

        <span className="flex items-center gap-2 text-sm text-muted">
          {isRevised ? (
            <CheckCircle2 className="h-4 w-4 text-ok" strokeWidth={1.8} />
          ) : (
            <Clock className="h-4 w-4 text-warn" strokeWidth={1.8} />
          )}
          <Badge tone={isRevised ? "ok" : "warn"}>
            {isRevised ? "Revisado" : "Pendiente"}
          </Badge>
        </span>

        {canComment && (
          <span className="ml-auto text-xs text-muted">
            Selecciona texto en el documento para comentarlo.
          </span>
        )}
      </motion.div>

      {/* El documento manda y ocupa dos tercios; las correcciones viven a su
          derecha, como en cualquier editor colaborativo. */}
      {/* `min-h-0` es lo que permite que los hijos se encojan y hagan scroll
          por dentro en lugar de estirar la página. */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-3">
        <Card padded={false} className="min-h-0 overflow-hidden bg-surface-2 lg:col-span-2">
          <DisplayNotesSidebarExample
            fileUrl={documentUrl}
            notes={notes}
            onAddNote={handleAddNote}
            canComment={canComment}
            selectedHighlightId={selectedHighlightId}
          />
        </Card>

        <Card padded={false} className="min-h-0 overflow-hidden">
          <CommentsPanel
            comments={comments}
            onUpdateComments={fetchComments}
            onCommentClick={handleCommentClick}
            selectedCommentId={selectedHighlightId}
          />
        </Card>
      </div>
    </AppLayout>
  );
};

export default DocumentoViewer;
