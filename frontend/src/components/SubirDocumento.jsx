import React, { useState } from "react";
import { uploadFile, createDocument } from "../core/Document";
import { successAlert, errorAlert } from "./Alerts/Alerts";
import PropTypes from "prop-types";

const SubirDocumento = ({ projectId, onClose }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!file || !title || !projectId) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    try {
      const uploadedFile = await uploadFile(file);
      await createDocument(title, uploadedFile.id, projectId);
      const mensaje = "Documento subido correctamente";
      successAlert(mensaje);
      setTitle("");
      setFile(null);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error uploading document:", error);
      const mensaje =
        error.response?.data?.message || "Error al subir el documento";
      errorAlert(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-white rounded-lg shadow-md"
    >
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-semibold text-gray-800 mb-2"
        >
          Título del Documento
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 ease-in-out"
          required
        />
      </div>

      <div>
        <label
          htmlFor="file"
          className="block text-sm font-semibold text-gray-800 mb-2"
        >
          Archivo del Documento
        </label>
        <input
          type="file"
          id="file"
          accept=".pdf" // Solo permite archivos con extensión .pdf
          onChange={(e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile && selectedFile.type === "application/pdf") {
              setFile(selectedFile); // Solo se establece si es un archivo PDF válido
            } else {
              alert("Por favor, selecciona un archivo PDF válido.");
              e.target.value = null; // Limpia el input si no es válido
            }
          }}
          className="w-full border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 ease-in-out"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 text-lg ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isSubmitting ? "Subiendo Documento..." : "Subir Documento"}
      </button>
    </form>
  );
};

SubirDocumento.propTypes = {
  projectId: PropTypes.string.isRequired,
  onClose: PropTypes.func,
};

export default SubirDocumento;
