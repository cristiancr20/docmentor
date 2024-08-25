// src/components/DocumentoViewer.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import Navbar from "./Navbar";
import CommentsPanel from "./CommentsPanel";
import { getDocumentById, getCommentsByDocument, addCommentToDocument } from "../core/apiCore";

const DocumentoViewer = () => {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const STRAPI_URL = "http://localhost:1337";

  useEffect(() => {
    fetchDocument();
    fetchComments();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const data = await getDocumentById(documentId);
      console.log("Document response:", data);
      setDocument(data);
    } catch (error) {
      setError("Error fetching document details");
    }
  };

  const fetchComments = async () => {
    try {
      const data = await getCommentsByDocument(documentId);
      setComments(data);
    } catch (error) {
      setError("Error fetching comments");
    }
  };


  const tutorId = localStorage.getItem("userId");

  console.log("Tutor ID:", tutorId);
  const handleAddComment = async (newComment) => {
    try {
      await addCommentToDocument(documentId, newComment, tutorId);
      fetchComments(); // Refresh comments after adding a new one
    } catch (error) {
      console.error("Error adding comment:", error);
    }
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
  <div className="flex">
    {/* Panel del visor de documentos */}
    <div className="flex-1 p-4">
      <div className="pdf-container">
        <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.6.172/pdf.worker.min.js">
          <Viewer fileUrl={documentUrl} />
        </Worker>
      </div>
    </div>

    {/* Panel de comentarios */}
    <div className="flex-1 p-4 ml-4 bg-gray-100 border border-gray-300 rounded-lg">
      <CommentsPanel comments={comments} onAddComment={handleAddComment} />
    </div>
  </div>
</div>

    </div>
  );
};

export default DocumentoViewer;
