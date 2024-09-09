import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import CommentsPanel from "../components/CommentsPanel";
import { getDocumentById } from "../core/Document";
import {
  getCommentsByDocument,
  addCommentToDocument,
} from "../core/Comments.js";

import DisplayNotesSidebarExample from "../components/DisplayNotesSidebarExample.tsx";

const DocumentoViewer = () => {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [notes, setNotes] = useState([]);
  const STRAPI_URL = "http://localhost:1337";
  const tutorId = localStorage.getItem("userId");
  const rol = localStorage.getItem("rol");

  useEffect(() => {
    fetchDocument();
    fetchComments();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const data = await getDocumentById(documentId);
      setDocument(data);
    } catch (error) {
      setError("Error fetching document details");
    }
  };

  const fetchComments = async () => {
    try {
      const data = await getCommentsByDocument(documentId);
      setComments(data);

      if (data) {
        const notesWithHighlights = data.map((comment) => ({
          id: comment.id,
          content: comment.attributes.correccion,
          highlightAreas: JSON.parse(comment.attributes.highlightAreas) || [],
          quote: comment.attributes.quote || "",
        }));

        setNotes(notesWithHighlights);
      }
    } catch (error) {
      setError("Error fetching comments");
    }
  };

  const handleAddComment = async (newComment, highlightAreas, quote) => {
    try {
      await addCommentToDocument(
        documentId,
        newComment,
        tutorId,
        highlightAreas,
        quote
      );
      fetchComments(); // Refrescar los comentarios después de agregar uno nuevo
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleAddNote = (note) => {
    handleAddComment(note.content, note.highlightAreas, note.quote);
  };

  if (error) {
    return <p className="text-red-500 mb-4">{error}</p>;
  }

  if (!document) {
    return <p>Cargando documento...</p>;
  }

  const documentAttributes = document?.data?.attributes || {};
  const documentFile =
    documentAttributes?.documentFile?.data?.[0]?.attributes?.url;

  if (!documentFile) {
    return <p>No se encontró el archivo del documento.</p>;
  }

  const documentUrl = `${STRAPI_URL}${documentFile}`;

  return (
    <div>
      <Navbar />

      <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-3xl font-bold mb-4">{documentAttributes.title}</h1>
        <div className="columns-2">
          {/* Panel del visor de documentos */}
          <div className="p-4">
            {" "}
            {/* 75% del ancho */}
            <div className="pdf-container">
              <DisplayNotesSidebarExample
                fileUrl={documentUrl}
                notes={notes || []} // Pasar las notas con las áreas resaltadas
                onAddNote={handleAddNote}
                isTutor={rol === "tutor"}
              />
            </div>
          </div>

          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
            {" "}
            {/* 25% del ancho */}
            <CommentsPanel
              comments={comments}
              onUpdateComments={fetchComments}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentoViewer;
