import React, { useState } from "react";
import { uploadFile, createDocument } from "../core/Document";
import { successAlert, errorAlert } from "./Alerts/Alerts";

const SubirDocumento = ({ projectId, onClose }) => { // Asegúrate de recibir onClose como prop
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !title || !projectId) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    try {
      const uploadedFile = await uploadFile(file);
      const documentData = await createDocument(title, uploadedFile.id, projectId); // Pasa el projectId
      console.log("Documento creado:", documentData);
      successAlert();
      setTitle("");
      setFile(null);
      if (onClose) onClose(); // Llama a onClose para cerrar el modal
    } catch (error) {
      console.error("Error uploading document:", error);
      errorAlert();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
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
      onChange={(e) => setFile(e.target.files[0])}
      className="w-full border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 ease-in-out"
      required
    />
  </div>

  <button
    type="submit"
    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
  >
    Subir Documento
  </button>
</form>

  );
};

export default SubirDocumento;
