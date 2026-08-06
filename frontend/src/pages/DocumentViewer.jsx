import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
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
import DisplayNotesSidebarExample from "../components/DisplayNotesSidebarExample.tsx";
import { getDocumentById } from "../core/Document";
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
    } catch (error) {
      setError("Error fetching document details");
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleCommentClick = (comment) => {
    try {
      const highlightAreas = JSON.parse(comment.attributes.highlightAreas);

      // Verificar si hay áreas válidas
      const validAreas = highlightAreas.filter(
        (area) => area.height > 0 && area.width > 0 && area.pageIndex >= 0
      );

      if (validAreas.length > 0) {
        setSelectedHighlightId(comment.id);
      }
    } catch (error) {
      console.error("Error parsing highlight areas:", error);
    }
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

      fetchComments();
      fetchDocument();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleRevisadoClick = async () => {
    setIsSubmitting(true);

    try {
      await updateDocumentStatusRevisado(documentId);
      fetchDocument();
    } catch (error) {
      console.error("Error updating document status:", error);
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
      title={title}
      description="Revisa el documento y gestiona las correcciones."
      actions={
        <>
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="mb-6 grid gap-4 sm:grid-cols-2"
      >
        <Card padded={false} className="flex items-center gap-4 p-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-wash text-accent">
            <Calendar className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted">Fecha de creación</p>
            <p className="truncate font-mono text-sm text-content">
              {formatDateTime(publishedAt)}
            </p>
          </div>
        </Card>

        <Card padded={false} className="flex items-center gap-4 p-5">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
              isRevised ? "bg-ok-wash text-ok" : "bg-warn-wash text-warn"
            }`}
          >
            {isRevised ? (
              <CheckCircle2 className="h-5 w-5" strokeWidth={1.8} />
            ) : (
              <Clock className="h-5 w-5" strokeWidth={1.8} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted">Estado de revisión</p>
            <Badge tone={isRevised ? "ok" : "warn"} className="mt-1">
              {isRevised ? "Revisado" : "Pendiente"}
            </Badge>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false} className="max-h-[80vh] overflow-hidden">
          <CommentsPanel
            comments={comments}
            onUpdateComments={fetchComments}
            onCommentClick={handleCommentClick}
          />
        </Card>

        {/* El visor de PDF pinta su propio lienzo: solo aporta el marco y el alto. */}
        <Card padded={false} className="h-[80vh] overflow-auto bg-surface-2 p-2">
          <DisplayNotesSidebarExample
            fileUrl={documentUrl}
            notes={notes}
            onAddNote={handleAddNote}
            canComment={canComment}
            selectedHighlightId={selectedHighlightId}
          />
        </Card>
      </div>
    </AppLayout>
  );
};

export default DocumentoViewer;
