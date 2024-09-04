import React, { useState, useEffect } from "react";
import { updateProject } from "../core/apiCore";
import Swal from "sweetalert2";
import axios from "axios";

const EditProject = ({ project, onClose, onUpdate }) => {
  console.log("Proyecto a editar:", project);

  const [formData, setFormData] = useState({
    Title: "",
    Descripcion: "",
    tutor: "", // Asegúrate de que esto esté alineado con tus datos
  });
  const [tutors, setTutors] = useState([]);

  useEffect(() => {
    if (project) {
      setFormData({
        Title: project.Title || '',
        Descripcion: project.Descripcion || '',
        tutor: project.tutor ? project.tutor.id : '', // Extraer el ID del tutor
      });
    }

    fetchTutors();
  }, [project]);

  const fetchTutors = async () => {
    try {
      const response = await axios.get(
        "http://localhost:1337/api/users?filters[rol][tipoRol][$eq]=tutor"
      );
      setTutors(response.data);
    } catch (error) {
      console.error('Error al obtener la lista de tutores:', error);
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
        Swal.fire("Error!", "Debes seleccionar un tutor.", "error");
        return;
      }

      await updateProject(project.id, formData);
      onUpdate(); // Notifica al componente padre que se actualizó el proyecto
      onClose(); // Cierra el modal
      Swal.fire("Editado!", "El proyecto ha sido editado.", "success");
    } catch (error) {
      console.error("Error al actualizar el proyecto:", error);
      Swal.fire(
        "Error!",
        "Hubo un problema al actualizar el proyecto.",
        "error"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Título
        </label>
        <input
          type="text"
          name="Title"
          value={formData.Title}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Descripción
        </label>
        <textarea
          name="Descripcion"
          value={formData.Descripcion}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="tutor" className="block text-gray-700 font-semibold mb-2">
          Seleccionar Tutor
        </label>
        <select
          id="tutor"
          name="tutor"
          value={formData.tutor}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
          required
        >
          <option value="">Selecciona un tutor</option>
          {tutors.map((tutor) => (
            <option key={tutor.id} value={tutor.id}>
              {tutor.username}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Guardar Cambios
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default EditProject;
