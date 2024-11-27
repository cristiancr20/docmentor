import React, { useEffect, useState } from "react";
import { getProjectsByTutor } from "../core/Projects";
import Navbar from "../components/Navbar";
import ProjectsTable from "../components/ProjectsTable";
import { decryptData } from "../utils/encryption";

const ProjectsAsignedTutor = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [error, setError] = useState(null);
  const [authorFilter, setAuthorFilter] = useState("");
  const [itineraryFilter, setItineraryFilter] = useState("");
  const [dateSortOrder, setDateSortOrder] = useState("recent"); // 'recent' or 'oldest'
  let userId = null;

  const encryptedUserData = localStorage.getItem("userData");

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = decryptData(encryptedUserData);

    // Acceder al rol desde los datos desencriptados

    userId= decryptedUserData.id

  } else {
    console.log("No se encontró el userData en localStorage");
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (userId) {
          const userProjects = await getProjectsByTutor(userId);
          setProjects(userProjects);
          setFilteredProjects(userProjects); // Set initial filtered projects
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

  // Filter projects whenever any filter value changes
  useEffect(() => {
    handleFilterChange();
  }, [authorFilter, itineraryFilter, dateSortOrder]);

  const handleFilterChange = () => {
    let filtered = projects;

    if (authorFilter) {
      filtered = filtered.filter((project) =>
        project.estudiante.email
          .toLowerCase()
          .includes(authorFilter.toLowerCase())
      );
    }

    if (itineraryFilter) {
      filtered = filtered.filter(
        (project) =>
          project.itinerario &&
          project.itinerario.toLowerCase() === itineraryFilter.toLowerCase()
      );
    }

    if (dateSortOrder) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.FechaCreacion);
        const dateB = new Date(b.FechaCreacion);
        return dateSortOrder === "recent" ? dateB - dateA : dateA - dateB;
      });
    }

    setFilteredProjects(filtered);
  };

  const columns = [
    {
      key: "estudiante",
      label: "Estudiante",
      render: (project) => project.estudiante.email,
    },
    { key: "Title", label: "Título" },
    { key: "Descripcion", label: "Descripción" },
    { key: "itinerario", label: "Itinerario" },
    { key: "FechaCreacion", label: "Fecha de Creación" },
  ];

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        {error && <p className="text-red-500">{error}</p>}

        {/* Filters */}

        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por Autor"
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="p-2 border rounded"
          />

          <select
            value={itineraryFilter}
            onChange={(e) => setItineraryFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
          >
            <option value="" className="bg-white">
              Seleccionar Itinerario
            </option>
            <option value="Ingenieria de Software" className="bg-white">
              Ingeniería de Software
            </option>
            <option value="Sistemas Inteligentes" className="bg-white">
              Sistemas Inteligentes
            </option>
            <option value="Computación Aplicada" className="bg-white">
              Computación Aplicada
            </option>
            {/* Asegúrate de que estos valores coincidan con los de los proyectos */}
          </select>

          <select
            value={dateSortOrder}
            onChange={(e) => setDateSortOrder(e.target.value)}
            className="p-2 border border-gray-300 rounded bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer"
          >
            <option value="recent" className="bg-white">
              Más Recientes
            </option>
            <option value="oldest" className="bg-white">
              Más Antiguos
            </option>
          </select>
        </div>

        <ProjectsTable
          projects={filteredProjects}
          columns={columns}
          linkBase="/proyecto"
        />
      </div>
    </div>
  );
};

export default ProjectsAsignedTutor;
