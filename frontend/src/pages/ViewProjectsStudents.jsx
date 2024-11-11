import React, { useEffect, useState } from "react";
import { getProjectsByStudents } from "../core/Projects";
import Navbar from "../components/Navbar";
import ProjectsTable from "../components/ProjectsTable";
import NewProject from "../components/NewProject";
import EditProject from "../components/EditProject";
import { motion, AnimatePresence } from "framer-motion";

const ViewProjectsStudents = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      fetchProjects();
    } else {
      setError("User ID is not available");
    }
  }, [userId]);

  const fetchProjects = async () => {
    try {
      const userProjects = await getProjectsByStudents(userId);
      setProjects(userProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Error fetching projects");
    }
  };

  const handleEdit = (projectId) => {
    const project = projects.find((project) => project.id === projectId);
    setCurrentProject(project);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    await fetchProjects();
    setIsEditModalOpen(false);
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
          transition={{ duration: 0.6, ease: "easeOut" }}
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

      {/* Modal para Nuevo Proyecto */}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4 md:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                duration: 0.5,
                bounce: 0.3,
              }}
              className="bg-white rounded-xl shadow-2xl w-full sm:w-[500px] md:w-[600px] lg:w-[800px] xl:w-[1000px] relative overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Crear Nuevo Proyecto
                  </h2>
                  <motion.button
                    onClick={() => setIsModalOpen(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-gray-500 hover:text-red-600 transition-colors duration-200 rounded-lg p-2 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <svg
                      className="w-6 h-6 md:w-7 md:h-7"
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
                  </motion.button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <NewProject
                    onClose={() => setIsModalOpen(false)}
                    fetchProjects={fetchProjects}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para Editar Proyecto */}
      <AnimatePresence>
        {isEditModalOpen && currentProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50"
          >
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
              <EditProject
                project={currentProject}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdate}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewProjectsStudents;
