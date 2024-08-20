// ViewProjects.jsx
import React, { useEffect, useState } from "react";
import { getProjectsByStudents } from "../core/apiCore";
import Navbar from "../components/Navbar";
import { FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";

const ViewProjectsStudents = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId"); // Obtén el ID del usuario desde el almacenamiento local

  useEffect(() => {
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

    fetchProjects();
  }, [userId]);

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        {error && <p className="text-red-500">{error}</p>}
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 text-center">
          <thead className="text-xs text-gray-700 uppercase bg-gray-900 dark:bg-gray-900 dark:text-gray-400 ">
            <tr>
              <th className="px-4 py-2 ">Título</th>
              <th className="px-4 py-2 ">Descripción</th>
              <th className="px-4 py-2 ">Fecha de Creación</th>
              <th className="px-4 py-2 ">Tutor</th>
              <th className="px-4 py-2 ">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr className="bg-gray-800 text-white dark:border-gray-700">
                <td colSpan="4" className="px-4 py-2 text-center">
                  No hay proyectos disponibles
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  className="bg-gray-800 text-white dark:border-gray-700 text-center"
                  key={project.id}
                >
                  <td className="px-4 py-2 ">{project.Title}</td>
                  <td className="px-4 py-2 ">{project.Descripcion}</td>
                  <td className="px-4 py-2 ">{project.FechaCreacion}</td>
                  <td className="px-4 py-2 ">{project.tutor.email}</td>
                  <td className="px-4 py-2 ">
                    <Link to={`/proyecto/${project.id}/version`}>
                      <FaEye />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewProjectsStudents;
