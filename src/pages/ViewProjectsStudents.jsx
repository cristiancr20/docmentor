// ViewProjectsStudents.jsx
import React, { useEffect, useState } from "react";
import { getProjectsByStudents } from "../core/apiCore";
import Navbar from "../components/Navbar";
import ProjectsTable from "../components/ProjectsTable";

const ViewProjectsStudents = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId");

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

  const columns = [
    { key: 'Title', label: 'Título' },
    { key: 'Descripcion', label: 'Descripción' },
    { key: 'FechaCreacion', label: 'Fecha de Creación' },
    { key: 'tutor', label: 'Tutor', render: (project) => project.tutor.email },
  ];

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        {error && <p className="text-red-500">{error}</p>}
        <ProjectsTable projects={projects} columns={columns} linkBase="/proyecto" />
      </div>
    </div>
  );
};

export default ViewProjectsStudents;
