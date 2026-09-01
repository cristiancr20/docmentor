import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Clock,
  FolderKanban,
  GraduationCap,
  ScrollText,
  UserCog,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Card, { CardHeader } from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { Select } from "../components/ui/Input";
import { SkeletonStats, SkeletonRows } from "../components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getAllProjects, getAllUsers, assignTutorToProject } from "../core/Projects";
import { getDocumentsByProjectId } from "../core/Document";
import { formatDate } from "../utils/format";

// Entrada corta y uniforme: sin retardo por índice, que dejaba el final de las
// listas largas apareciendo varios segundos después.
const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

function CoordinatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTutor, setFilterTutor] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [pendingDocuments, setPendingDocuments] = useState(0);
  const [tutorLoadMap, setTutorLoadMap] = useState({});
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTutorForAssign, setSelectedTutorForAssign] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsData, tutorsData, studentsData] = await Promise.all([
        getAllProjects(),
        getAllUsers("tutor"),
        getAllUsers("estudiante"),
      ]);

      setProjects(projectsData);
      setFilteredProjects(projectsData);
      setTutors(tutorsData);
      setStudents(studentsData);

      await calculateMetrics(projectsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async (projectsData) => {
    try {
      let totalPending = 0;
      const tutorLoad = {};

      for (const project of projectsData) {
        const projectDocuments = await getDocumentsByProjectId(project.id);
        if (projectDocuments.data) {
          const pendingCount = projectDocuments.data.filter(
            doc => doc.attributes.status === "En Revisión" || doc.attributes.status === "Subido"
          ).length;
          totalPending += pendingCount;
        }

        if (project.attributes.tutor?.data) {
          const tutorId = project.attributes.tutor.data.id;
          tutorLoad[tutorId] = (tutorLoad[tutorId] || 0) + 1;
        }
      }

      setPendingDocuments(totalPending);
      setTutorLoadMap(tutorLoad);
    } catch (err) {
      console.error("Error calculating metrics:", err);
    }
  };

  const applyFilters = (projectsList, status, tutor, date) => {
    let filtered = [...projectsList];

    if (status !== "all") {
      filtered = filtered.filter(p => p.attributes.status === status);
    }

    if (tutor !== "all") {
      filtered = filtered.filter(p => p.attributes.tutor?.data?.id === parseInt(tutor));
    }

    if (date !== "all") {
      const now = new Date();
      const daysDiff = parseInt(date);
      const cutoffDate = new Date(now.getTime() - daysDiff * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => new Date(p.attributes.createdAt) >= cutoffDate);
    }

    return filtered;
  };

  const handleFilterChange = (status, tutor, date) => {
    setFilterStatus(status);
    setFilterTutor(tutor);
    setFilterDate(date);
    const filtered = applyFilters(projects, status, tutor, date);
    setFilteredProjects(filtered);
  };

  const handleAssignTutor = async () => {
    if (!selectedProject || !selectedTutorForAssign) {
      alert("Por favor selecciona un tutor");
      return;
    }

    try {
      setAssignLoading(true);
      await assignTutorToProject(selectedProject.id, parseInt(selectedTutorForAssign));

      const updatedProjects = projects.map(p =>
        p.id === selectedProject.id
          ? {
              ...p,
              attributes: {
                ...p.attributes,
                tutor: {
                  data: {
                    id: parseInt(selectedTutorForAssign),
                    attributes: tutors.find(t => t.id === parseInt(selectedTutorForAssign))?.attributes,
                  },
                },
              },
            }
          : p
      );

      setProjects(updatedProjects);
      const filtered = applyFilters(updatedProjects, filterStatus, filterTutor, filterDate);
      setFilteredProjects(filtered);
      await calculateMetrics(updatedProjects);

      setAssignModalOpen(false);
      setSelectedProject(null);
      setSelectedTutorForAssign("");
    } catch (err) {
      console.error("Error assigning tutor:", err);
      alert("Error al asignar tutor");
    } finally {
      setAssignLoading(false);
    }
  };

  const getTutorMostLoaded = () => {
    if (Object.keys(tutorLoadMap).length === 0) return null;
    const [tutorId] = Object.entries(tutorLoadMap).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );
    return tutors.find(t => t.id === parseInt(tutorId));
  };

  const title = `Panel de coordinación, ${user?.username ?? ""}`;
  const description = "Supervisa proyectos y gestiona la carga de tutores";

  if (loading) {
    return (
      <AppLayout title={title} description={description}>
        <SkeletonStats count={4} />
        <div className="mt-6">
          <SkeletonRows count={6} />
        </div>
      </AppLayout>
    );
  }

  const tutorMostLoaded = getTutorMostLoaded();

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedProject(null);
    setSelectedTutorForAssign("");
  };

  const actions = (
    <Button variant="secondary" onClick={() => navigate("/audit-logs")}>
      <ScrollText className="h-4 w-4" strokeWidth={1.8} />
      Ver auditoría
    </Button>
  );

  return (
    <AppLayout title={title} description={description} actions={actions}>
      <motion.div {...fadeIn} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total proyectos" value={projects.length} icon={FolderKanban} />
        <StatCard
          label="Total estudiantes"
          value={students.length}
          icon={GraduationCap}
          tone="info"
        />
        <StatCard label="Total tutores" value={tutors.length} icon={UserCog} tone="ok" />
        <StatCard label="Docs. pendientes" value={pendingDocuments} icon={Clock} tone="warn" />
      </motion.div>

      <motion.div {...fadeIn} className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Documentos pendientes"
            description="En revisión o recién subidos"
          />
          <p className="font-display text-2xl font-bold tabular text-content">
            {pendingDocuments}
          </p>
        </Card>

        <Card>
          <CardHeader title="Tutor con mayor carga" />
          {tutorMostLoaded ? (
            <>
              <p className="font-display text-lg font-semibold text-content">
                {tutorMostLoaded.username}
              </p>
              <p className="mt-1 text-sm tabular text-muted">
                {tutorLoadMap[tutorMostLoaded.id]} proyecto(s) asignado(s)
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">No hay tutores asignados</p>
          )}
        </Card>
      </motion.div>

      {error && (
        <div className="mt-6 rounded-xl border border-line bg-danger-wash p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <motion.div {...fadeIn} className="mt-6">
        <Card padded={false}>
          <div className="p-6 pb-0">
            <CardHeader title="Proyectos" description={`${filteredProjects.length} resultado(s)`} />

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <Select
                id="filtro-estado"
                label="Estado"
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value, filterTutor, filterDate)}
              >
                <option value="all">Todos</option>
                <option value="Creado">Creado</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Rechazado">Rechazado</option>
              </Select>

              <Select
                id="filtro-tutor"
                label="Tutor"
                value={filterTutor}
                onChange={(e) => handleFilterChange(filterStatus, e.target.value, filterDate)}
              >
                <option value="all">Todos</option>
                {tutors.map(tutor => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.username}
                  </option>
                ))}
              </Select>

              <Select
                id="filtro-fecha"
                label="Fecha"
                value={filterDate}
                onChange={(e) => handleFilterChange(filterStatus, filterTutor, e.target.value)}
              >
                <option value="all">Cualquier fecha</option>
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
              </Select>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="p-6 pt-0">
              <EmptyState
                icon={ClipboardList}
                title="No hay proyectos que coincidan con los filtros"
                description="Prueba a ampliar el rango de fechas o quitar el filtro de tutor."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Proyecto</th>
                    <th className="px-6 py-3 text-left font-medium">Descripción</th>
                    <th className="px-6 py-3 text-left font-medium">Tutor</th>
                    <th className="px-6 py-3 text-left font-medium">Estado</th>
                    <th className="px-6 py-3 text-left font-medium">Fecha</th>
                    <th className="px-6 py-3 text-left font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredProjects.map(project => (
                    <tr key={project.id} className="transition-colors hover:bg-surface-2">
                      <td className="px-6 py-4 font-medium text-content">
                        {project.attributes.title}
                      </td>
                      <td className="px-6 py-4 text-muted">
                        <span className="line-clamp-2">
                          {project.attributes.description || "Sin descripción"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {project.attributes.tutor?.data?.attributes?.username || "No asignado"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={project.attributes.status || "Creado"} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted">
                        {formatDate(project.attributes.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/project/${project.id}`)}
                          >
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setSelectedTutorForAssign(project.attributes.tutor?.data?.id || "");
                              setAssignModalOpen(true);
                            }}
                          >
                            Asignar tutor
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      <Modal
        open={assignModalOpen}
        onClose={closeAssignModal}
        size="sm"
        title="Asignar tutor"
        description={selectedProject?.attributes.title}
        footer={
          <>
            <Button variant="secondary" onClick={closeAssignModal}>
              Cancelar
            </Button>
            <Button onClick={handleAssignTutor} loading={assignLoading}>
              {assignLoading ? "Asignando..." : "Asignar"}
            </Button>
          </>
        }
      >
        <Select
          id="asignar-tutor"
          label="Selecciona un tutor"
          value={selectedTutorForAssign}
          onChange={(e) => setSelectedTutorForAssign(e.target.value)}
        >
          <option value="">-- Selecciona --</option>
          {tutors.map(tutor => (
            <option key={tutor.id} value={tutor.id}>
              {tutor.username} ({tutorLoadMap[tutor.id] || 0} proyectos)
            </option>
          ))}
        </Select>
      </Modal>
    </AppLayout>
  );
}

export default CoordinatorDashboard;
