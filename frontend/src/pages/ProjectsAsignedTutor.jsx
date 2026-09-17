import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { getProjectsByTutor } from "../core/Projects";
import AppLayout from "../components/layout/AppLayout";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Select, inputClass } from "../components/ui/Input";
import { SkeletonRows } from "../components/ui/Skeleton";
import ProjectsTable from "../components/ProjectsTable";
import { decryptData } from "../utils/encryption";
import { formatDateTime } from "../utils/format";

const ITINERARIES = [
  "Ingeniería de Software",
  "Sistemas Inteligentes",
  "Computación Aplicada",
];

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

const ProjectsAsignedTutor = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorFilter, setAuthorFilter] = useState("");
  const [itineraryFilter, setItineraryFilter] = useState("");
  let userEmail = null;

  const encryptedUserData = localStorage.getItem("userData");

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = decryptData(encryptedUserData);

    userEmail = decryptedUserData.email;
  } else {
    console.log("No se encontró el userData en localStorage");
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        if (userEmail) {
          const userProjects = await getProjectsByTutor(userEmail);
          setProjects(userProjects);
          setFilteredProjects(userProjects);
        } else {
          setError("No se pudo obtener el correo del usuario");
        }
      } catch (error) {
        setError("Error al cargar los proyectos");
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userEmail]);

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
          project.itinerary.toLowerCase().trim() === itineraryFilter.toLowerCase().trim()
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
        <ul className="flex flex-col gap-1">
          {project.students.map((estudiante) => (
            <li key={estudiante.id}>
              <span className="text-content">{estudiante.username}</span>
              <span className="ml-2 font-mono text-xs text-muted">{estudiante.email}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "title",
      label: "Título",
      render: (project) => <span className="font-medium text-content">{project.title}</span>,
    },
    {
      key: "description",
      label: "Descripción",
      render: (project) => (
        <span className="line-clamp-2 block max-w-xs text-muted">{project.description}</span>
      ),
    },
    {
      key: "projectType",
      label: "Tipo de proyecto",
      render: (project) => <Badge tone="neutral">{project.projectType || "—"}</Badge>,
    },
    {
      key: "status",
      label: "Estado",
      render: (project) => <Badge status={project.status || "Creado"} />,
    },
    {
      key: "FechaCreacion",
      label: "Fecha de creación",
      render: (project) => (
        <span className="whitespace-nowrap font-mono text-xs text-muted">
          {formatDateTime(project.publishedAt)}
        </span>
      ),
    },
  ];

  return (
    <AppLayout
      title="Proyectos asignados"
      description="Proyectos en los que participas como tutor"
    >
      {error && (
        <div className="mb-6 rounded-xl border border-line bg-danger-wash p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <motion.div {...fadeIn}>
        <Card padded={false}>
          <div className="flex flex-col gap-3 border-b border-line p-6 md:flex-row md:items-end">
            <div className="w-full md:max-w-xs">
              <Select
                id="itineraryFilter"
                label="Itinerario"
                value={itineraryFilter}
                onChange={(e) => setItineraryFilter(e.target.value)}
              >
                <option value="">Todos los itinerarios</option>
                {ITINERARIES.map((itinerary) => (
                  <option key={itinerary} value={itinerary}>
                    {itinerary}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex w-full flex-col gap-1.5 md:max-w-sm">
              <label htmlFor="authorFilter" className="text-sm font-medium text-content">
                Estudiante
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  strokeWidth={1.8}
                />
                <input
                  id="authorFilter"
                  type="text"
                  placeholder="Buscar por correo del estudiante"
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <SkeletonRows count={5} />
            ) : (
              <ProjectsTable projects={filteredProjects} columns={columns} linkBase="/project" />
            )}
          </div>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default ProjectsAsignedTutor;
