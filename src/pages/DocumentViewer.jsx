import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import CommentsPanel from "../components/CommentsPanel";
import { getDocumentById } from "../core/Document";
import {
  getCommentsByDocument,
  addCommentToDocument,
} from "../core/Comments.js";

import { motion } from "framer-motion";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

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
      fetchDocument();
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

      <div className="container mx-auto p-6 bg-white shadow-md rounded-lg ">
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-6 pb-3 border-b border-gray-200"
          >
            {documentAttributes.title}
          </motion.h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de Creación */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4"
            >
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">
                  Fecha de Creación
                </h2>
                <p className="text-lg font-semibold text-gray-900">
                  {documentAttributes.fechaSubida}
                </p>
              </div>
            </motion.div>

            {/* Estado de Revisión */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`p-4 rounded-xl shadow-sm border flex items-center space-x-4 ${
                documentAttributes.revisado
                  ? "bg-green-50 border-green-100"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <div
                className={`p-3 rounded-lg ${
                  documentAttributes.revisado ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {documentAttributes.revisado ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">
                  Estado de Revisión
                </h2>
                <p
                  className={`text-lg font-semibold ${
                    documentAttributes.revisado
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {documentAttributes.revisado ? "Revisado" : "Pendiente"}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="columns-2">
          {/* Panel del visor de documentos */}
          <div className="bg-gray-900 rounded-lg">
            <div
              className="pdf-container  p-2"
              style={{ height: "100vh", overflow: "auto" }}
            >
              <DisplayNotesSidebarExample
                fileUrl={documentUrl}
                notes={notes || []} // Pasar las notas con las áreas resaltadas
                onAddNote={handleAddNote}
                isTutor={rol === "tutor"}
              />
            </div>
          </div>

          <div
            className="p-4 bg-gray-100 border border-gray-300 rounded-lg"
            style={{ height: "100vh", overflow: "auto" }}
          >
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
