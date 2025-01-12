import React, { useEffect, useState } from "react";
import { getProjectsByTutor } from "../core/Projects";
import Navbar from "../components/Navbar";
import ProjectsTable from "../components/ProjectsTable";
import { decryptData } from "../utils/encryption";
import Header from "../components/Header";

const ProjectsAsignedTutor = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [error, setError] = useState(null);
  const [authorFilter, setAuthorFilter] = useState("");
  const [itineraryFilter, setItineraryFilter] = useState("");
  let userId = null;

  const encryptedUserData = localStorage.getItem("userData");

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = decryptData(encryptedUserData);

    // Acceder al rol desde los datos desencriptados

    userId = decryptedUserData.id;
  } else {
    console.log("No se encontró el userData en localStorage");
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (userId) {
          const userProjects = await getProjectsByTutor(userId);
          setProjects(userProjects);
          setFilteredProjects(userProjects);
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

  useEffect(() => {
    handleFilterChange();
  }, [authorFilter, itineraryFilter]);

  const handleFilterChange = () => {
    let filtered = [...projects];

    if (authorFilter) {
      filtered = filtered.filter((project) =>
        project.students.some((estudiante) =>
          estudiante.email.toLowerCase().includes(authorFilter.toLowerCase())
        )
      );
    }

    if (itineraryFilter.trim()) {
      filtered = filtered.filter(
        (project) =>
          project.itinerary &&
          project.itinerary.toLowerCase().trim() ===
            itineraryFilter.toLowerCase().trim()
      );
    }

    setFilteredProjects(filtered);
  };

  const columns = [
    { key: "itinerary", label: "Itinerario" },
    {
      key: "estudiante",
      label: "Estudiante",
      render: (project) => (
        <ul>
          {project.students.map((estudiante) => (
            <li key={estudiante.id}>
              {estudiante.username}
              <span className="text-blue-600 ml-2">({estudiante.email})</span>
            </li>
          ))}
        </ul>
      ),
    },
    { key: "title", label: "Título" },
    { key: "description", label: "Descripción" },
    {
      key: "projectType",
      label: "Tipo de Proyecto",
      render: (project) => project.projectType,
    },
    {
      key: "FechaCreacion",
      label: "Fecha de Creación",
      render: (project) => {
        const date = new Date(project.publishedAt);
        // Convierte la fecha al formato local
        return date.toLocaleString("es-ES", {
          weekday: "long", // Día de la semana
          year: "numeric", // Año completo
          month: "long", // Mes completo
          day: "numeric", // Día del mes
          hour: "2-digit", // Hora en formato de 2 dígitos
          minute: "2-digit", // Minutos
          second: "2-digit", // Segundos
          hour12: false, // Usa el formato de 24 horas
        });
      },
    },
  ];

  return (
    <div>
      <Navbar />
      <Header /> 
      <div className="container mx-auto p-4">
        {error && <p className="text-red-500">{error}</p>}

        {/* Filters */}

        <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
          <select
            value={itineraryFilter}
            onChange={(e) => setItineraryFilter(e.target.value)}
            className="font-bold bg-gray-900 text-white py-3 px-6 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer text-center"
          >
            <option value="" className="bg-gray-700">
              Seleccionar Itinerario
            </option>
            <option value="Ingeniería de Software" className="bg-gray-700">
              Ingeniería de Software
            </option>
            <option value="Sistemas Inteligentes" className="bg-gray-700">
              Sistemas Inteligentes
            </option>
            <option value="Computación Aplicada" className="bg-gray-700">
              Computación Aplicada
            </option>
          </select>

          <div className="relative flex items-center w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-5 h-5 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m2.48-4.48a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por Estudiante"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none w-full"
            />
          </div>
        </div>

        <ProjectsTable
          projects={filteredProjects}
          columns={columns}
          linkBase="/project"
        />
      </div>
    </div>
  );
};

export default ProjectsAsignedTutor;
