// ViewProjects.jsx
import React, { useEffect, useState } from 'react';
import { getProjectsByTutor } from '../core/apiCore';
import Navbar from '../components/Navbar';
import ProjectsTable from '../components/ProjectsTable';

const ProjectsAsignedTutor = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (userId) {
          const userProjects = await getProjectsByTutor(userId);
          setProjects(userProjects);
        } else {
          setError('User ID is not available');
        }
      } catch (error) {
        setError('Error fetching projects');
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [userId]);

  const columns = [
    { key: 'estudiante', label: 'Estudiante', render: (project) => project.estudiante.email },
    { key: 'Title', label: 'Título' },
    { key: 'Descripcion', label: 'Descripción' },
    { key: 'FechaCreacion', label: 'Fecha de Creación' },
  ];

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        {error && <p className="text-red-500">{error}</p>}
        <ProjectsTable projects={projects} columns={columns} linkBase="/proyecto"/>
      </div>
    </div>
  );
};

export default ProjectsAsignedTutor;
