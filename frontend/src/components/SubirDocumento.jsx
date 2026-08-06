import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { uploadFile, createDocument } from "../core/Document";
import { successAlert, errorAlert } from "./Alerts/Alerts";
import Input, { inputClass } from "./ui/Input";
import Button from "./ui/Button";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

const SubirDocumento = ({ projectId, onClose }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // La validación va antes de bloquear el botón: al salir por aquí no se
    // restablecía `isSubmitting` y el formulario quedaba inutilizable.
    if (!file || !title || !projectId) {
      errorAlert("Por favor, complete todos los campos.");
      return;
    }

    setIsSubmitting(true);

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
      const mensaje = error.response?.data?.message || "Error al subir el documento";
      errorAlert(mensaje);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form {...fadeIn} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="title"
        label="Título del documento"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ingrese el título del documento"
        required
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="file" className="text-sm font-medium text-content">
          Archivo del documento
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
              errorAlert("Por favor, selecciona un archivo PDF válido.");
              e.target.value = null; // Limpia el input si no es válido
            }
          }}
          className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-medium file:text-content`}
          required
        />
        <p className="text-xs text-muted">Solo se admiten archivos PDF.</p>
      </div>

      <div className="flex justify-end gap-3 border-t border-line pt-4">
        {onClose && (
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {!isSubmitting && <Upload className="h-4 w-4" strokeWidth={1.8} />}
          {isSubmitting ? "Subiendo documento..." : "Subir documento"}
        </Button>
      </div>
    </motion.form>
  );
};

SubirDocumento.propTypes = {
  projectId: PropTypes.string.isRequired,
  onClose: PropTypes.func,
};

export default SubirDocumento;
