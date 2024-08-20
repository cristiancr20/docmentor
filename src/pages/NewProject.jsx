import React, { useState, useEffect } from "react";
import { createProject } from "../core/apiCore";
import axios from "axios";
import Navbar from "../components/Navbar";
import { successAlert, errorAlert } from "../components/Alerts/Alerts";

const CreateProjectForm = () => {
  const [title, setTitle] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tutor, setTutor] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState("");

  useEffect(() => {
    // Fetch tutors from the API (ensure that you have an endpoint for fetching users with the role 'tutor')
    const fetchTutors = async () => {
      const response = await axios.get(
        "http://localhost:1337/api/users?filters[rol][tipoRol][$eq]=tutor"
      );
      setTutor(response.data);
    };

    fetchTutors();
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
      const result = await createProject(projectData);
        successAlert();
        setTitle("");
        setDescripcion("");
        setSelectedTutor("");
        
    } catch (error) {
      console.error('Error al crear el proyecto:', error.response ? error.response.data : error.message);
      errorAlert();
    }
  };
  return (
    <div>
      <Navbar />
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto mt-8 p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Crear Nuevo Proyecto</h2>
      <div className="mb-4">
        <label htmlFor="title" className="block text-gray-700 font-semibold mb-2">Titulo del Proyecto</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
          placeholder="Titulo del Proyecto"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">Descripción del Proyecto</label>
        <textarea
          id="description"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
          placeholder="Descripción del Proyecto"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="tutor" className="block text-gray-700 font-semibold mb-2">Seleccionar Tutor</label>
        <select
          id="tutor"
          value={selectedTutor}
          onChange={(e) => setSelectedTutor(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
          required
        >
          <option value="">Elegir un tutor</option>
          {tutor.map((tutor) => (
            <option key={tutor.id} value={tutor.id}>{tutor.username}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300"
      >
        Crear un Proyecto
      </button>
    </form>
    </div>
  );
};

export default CreateProjectForm;
