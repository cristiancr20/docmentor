import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { getProjectsByStudents } from "../core/Projects";
import AppLayout from "../components/layout/AppLayout";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { SkeletonRows } from "../components/ui/Skeleton";
import ProjectsTable from "../components/ProjectsTable";
import NewProject from "../components/NewProject";
import EditProject from "../components/EditProject";
import { decryptData } from "../utils/encryption";
import { formatDateTime } from "../utils/format";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

const ViewProjectsStudents = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      if (userEmail) {
        const userProjects = await getProjectsByStudents(userEmail);
        setProjects(userProjects);
      } else {
        setError("No se pudo obtener el correo del usuario");
      }
    } catch (error) {
      setError(error.message || "Error al cargar los proyectos");
    } finally {
      setLoading(false);
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

  const handleDelete = async () => {
    await fetchProjects();
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
      key: "tutor",
      label: "Tutor",
      render: (project) => <span className="text-muted">{project.tutor.username}</span>,
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

  const actions = (
    <Button onClick={() => setIsModalOpen(true)}>
      <Plus className="h-4 w-4" strokeWidth={1.8} />
      Crear nuevo proyecto
    </Button>
  );

  return (
    <AppLayout
      title="Mis proyectos"
      description="Consulta, edita y crea los proyectos en los que participas"
      actions={actions}
    >
      {error && (
        <div className="mb-6 rounded-xl border border-line bg-danger-wash p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <motion.div {...fadeIn}>
        <Card padded={false}>
          {loading ? (
            <div className="p-6">
              <SkeletonRows count={5} />
            </div>
          ) : (
            <div className="p-6">
              <ProjectsTable
                projects={projects}
                columns={columns}
                linkBase="/project"
                fetchProjects={handleDelete}
                onEdit={handleEdit}
              />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Modal para nuevo proyecto */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear nuevo proyecto"
        description="Define el título, el itinerario y los integrantes del proyecto"
      >
        <NewProject onClose={() => setIsModalOpen(false)} fetchProjects={fetchProjects} />
      </Modal>

      {/* Modal para editar proyecto */}
      <Modal
        open={isEditModalOpen && Boolean(currentProject)}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar proyecto"
        size="sm"
      >
        {currentProject && (
          <EditProject
            project={currentProject}
            onClose={() => setIsEditModalOpen(false)}
            onUpdate={handleUpdate}
          />
        )}
      </Modal>
    </AppLayout>
  );
};

export default ViewProjectsStudents;
