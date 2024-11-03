import React, { useState, useEffect } from "react";
import { createProject } from "../core/Projects";
import { fetchTutors } from "../core/Projects";
import { successAlert, errorAlert } from "./Alerts/Alerts";
import { motion } from "framer-motion";

const NewProject = ({ onClose, fetchProjects }) => {
  const [title, setTitle] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tutor, setTutor] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState("");

  useEffect(() => {
    // Fetch tutors from the API (ensure that you have an endpoint for fetching users with the role 'tutor')
    const obtenerTutors = async () => {
      const response = await fetchTutors();
      setTutor(response.data);
    };

    obtenerTutors();
  }, []);

  const userId = localStorage.getItem("userId");
  const handleSubmit = async (e) => {
    e.preventDefault();

    const projectData = {
      Title: title,
      Descripcion: descripcion,
      tutor: parseInt(selectedTutor, 10),
      estudiante: userId,
      FechaCreacion: new Date().toISOString(),
    };

    try {
      await createProject(projectData);
      successAlert();
      fetchProjects();
      onClose();
      setTitle("");
      setDescripcion("");
      setSelectedTutor("");
    } catch (error) {
      console.error(
        "Error al crear el proyecto:",
        error.response ? error.response.data : error.message
      );
      errorAlert();
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="md:p-8 bg-gray-50"
    >
      <motion.form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-6 md:p-8"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label
              htmlFor="title"
              className="block text-gray-700 font-semibold mb-2 text-lg"
            >
              Título del Proyecto
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Ingrese el título de su proyecto"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label
              htmlFor="description"
              className="block text-gray-700 font-semibold mb-2 text-lg"
            >
              Descripción del Proyecto
            </label>
            <textarea
              id="description"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-h-[120px] resize-y"
              placeholder="Describa brevemente su proyecto"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label
              htmlFor="tutor"
              className="block text-gray-700 font-semibold mb-2 text-lg"
            >
              Seleccionar Tutor
            </label>
            <select
              id="tutor"
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
              required
            >
              <option value="">Seleccione un tutor</option>
              {tutor.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.username}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-4"
          >
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 text-lg"
            >
              Crear Proyecto
            </button>
          </motion.div>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default NewProject;
