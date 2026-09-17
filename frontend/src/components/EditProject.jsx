import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { updateProject, getTutors } from "../core/Projects";
import { errorAlert, successAlert } from "./Alerts/Alerts";
import { decryptData } from "../utils/encryption";
import Input, { Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

const EditProject = ({ project, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tutor: "", // Asegúrate de que esto esté alineado con tus datos
  });
  const [tutores, setTutores] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const encryptedUserData = localStorage.getItem("userData");
    if (encryptedUserData) {
      const decryptedUserData = decryptData(encryptedUserData);
      setUserData(decryptedUserData);
    }
  }, []);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        tutor: project.tutor ? project.tutor.id : "", // Extraer el ID del tutor
      });
    }

    if (userData) {
      obtenerTutors();
    }
  }, [project, userData]);

  const obtenerTutors = async () => {
    try {
      if (!userData) return;
      const response = await getTutors(userData.isInstitutional);
      setTutores(response);
    } catch (error) {
      console.error("Error al obtener la lista de tutores:", error);
      errorAlert("Error al cargar la lista de tutores");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.tutor) {
        errorAlert("Debes seleccionar un tutor.");
        return;
      }

      await updateProject(project.id, formData);
      onUpdate(); // Notifica al componente padre que se actualizó el proyecto
      onClose(); // Cierra el modal

      successAlert("El proyecto ha sido editado.");
    } catch (error) {
      console.error("Error al actualizar el proyecto:", error);
      const mensaje = error.response?.data?.message || "Error al actualizar el proyecto";
      errorAlert(mensaje);
    }
  };

  return (
    <motion.form {...fadeIn} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="title"
        name="title"
        label="Título"
        value={formData.title}
        onChange={handleChange}
      />

      <Textarea
        id="description"
        name="description"
        label="Descripción"
        rows={4}
        value={formData.description}
        onChange={handleChange}
      />

      <Select
        id="tutor"
        name="tutor"
        label="Tutor"
        data-testid="tutor-select"
        value={formData.tutor}
        onChange={handleChange}
        required
      >
        <option value="">Selecciona un tutor</option>
        {Array.isArray(tutores) && tutores.length > 0 ? (
          tutores.map((tutor) => (
            <option key={tutor.id} value={tutor.id}>
              {tutor.username}
            </option>
          ))
        ) : (
          <option disabled>Cargando tutores...</option>
        )}
      </Select>

      <div className="flex justify-end gap-3 border-t border-line pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Guardar cambios</Button>
      </div>
    </motion.form>
  );
};

EditProject.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    description: PropTypes.string,
    tutor: PropTypes.object,
  }),
};

export default EditProject;
