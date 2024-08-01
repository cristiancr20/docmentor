import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { uploadFile, createDocument } from "../core/apiCore";

import { successAlert, errorAlert } from "../components/Alerts/Alerts";

const SubirDocumento = () => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [userId, setUserId] = useState(); // Asegúrate de obtener el userId de manera correcta

  useEffect(() => {
    const usuarioId = localStorage.getItem("userId");
    setUserId(usuarioId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setUserId(userId);

    if (!file || !title || !userId) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    try {
      const uploadedFile = await uploadFile(file);
      const documentData = await createDocument(title, uploadedFile.id, userId);
      successAlert();
      setTitle("");
      setFile(null);

      console.log("Documento subido y creado exitosamente:", documentData);
    } catch (error) {
      console.error("Error uploading document:", error);
      errorAlert();
      setTitle("");
      setFile(null);
    }
  };

  return (
    <div>
      <Navbar />
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white p-8 shadow-lg rounded-lg"
      >
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Título del Documento
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ingresa el título"
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-700"
          >
            Selecciona un archivo
          </label>
          <input
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Subir
        </button>
      </form>
    </div>
  );
};

export default SubirDocumento;
