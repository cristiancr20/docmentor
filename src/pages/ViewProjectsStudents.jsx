// ViewProjectsStudents.jsx
import React, { useEffect, useState } from "react";
import { getProjectsByStudents } from "../core/Projects";
import Navbar from "../components/Navbar";
import ProjectsTable from "../components/ProjectsTable";
import NewProject from "../components/NewProject";
import EditProject from "../components/EditProject";

import { motion } from "framer-motion";

const ViewProjectsStudents = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  const fetchProjects = async () => {
    try {
      if (userId) {
        const userProjects = await getProjectsByStudents(userId);
        setProjects(userProjects);
      } else {
        setError("User ID is not available");
      }
    } catch (error) {
      setError("Error fetching projects");
      console.error("Error fetching projects:", error);
    }
  };
  

  const handleEdit = (projectId) => {
    const project = projects.find((project) => project.id === projectId);
    setCurrentProject(project);
    setIsEditModalOpen(true);
  }

  const handleUpdate = async () =>{
    await fetchProjects();
    setIsEditModalOpen(false);
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentProject(null);
  }

  const closeModalNewProject = () => {
    setIsModalOpen(false);
    // Opcionalmente, podrías volver a cargar los proyectos aquí si es necesario
    fetchProjects();
  };

  const columns = [
    { key: "Title", label: "Título" },
    { key: "Descripcion", label: "Descripción" },
    { key: "FechaCreacion", label: "Fecha de Creación" },
    { key: "tutor", label: "Tutor", render: (project) => project.tutor.email },

  ];



  return (
    <div>
      <Navbar />

      <div className="container mx-auto p-4">
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          onClick={() => setIsModalOpen(true)}
          className="m-4 bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Crear Nuevo Proyecto
        </motion.button>

        {error && <p className="text-red-500">{error}</p>}
        <ProjectsTable
          projects={projects}
          columns={columns}
          linkBase="/proyecto"
          fetchProjects={fetchProjects}
          onEdit={handleEdit}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex items-center text-gray-900 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md px-4 py-2 transition duration-150 ease-in-out bg-red-500"
            >
              <svg
                className="w-5 h-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cerrar
            </button>
            <NewProject onClose={closeModalNewProject} fetchProjects={fetchProjects} />
          </div>
        </div>
      )}
      {isEditModalOpen && currentProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
           
            <EditProject
              project={currentProject}
              onClose={closeEditModal}
              onUpdate={handleUpdate}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ViewProjectsStudents;
