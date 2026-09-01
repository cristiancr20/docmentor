import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, FolderKanban, Clock, Plus, Upload } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Card, { CardHeader } from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonStats, SkeletonRows } from "../components/ui/Skeleton";
import { PermissionGate } from "../components/PermissionGate";
import { useAuth } from "../context/AuthContext";
import { getProjectsByStudents } from "../core/Projects";
import { getDocumentsByProjectId } from "../core/Document";
import { decryptData } from "../utils/encryption";
import { formatDate } from "../utils/format";

// Entrada corta y uniforme: sin retardo por índice, que dejaba el final de las
// listas largas apareciendo varios segundos después.
const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [documentsInReview, setDocumentsInReview] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  let userEmail = null;

  const encryptedUserData = localStorage.getItem("userData");
  if (encryptedUserData) {
    const decryptedUserData = decryptData(encryptedUserData);
    userEmail = decryptedUserData.email;
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (userEmail) {
        const userProjects = await getProjectsByStudents(userEmail);
        setProjects(userProjects);

        const allDocuments = [];
        let inReviewCount = 0;

        for (const project of userProjects) {
          const projectDocuments = await getDocumentsByProjectId(project.id);
          if (projectDocuments.data) {
            const docsList = projectDocuments.data.map(doc => ({
              ...doc.attributes,
              id: doc.id,
              projectId: project.id,
              projectTitle: project.title
            }));
            allDocuments.push(...docsList);
            inReviewCount += docsList.filter(doc => doc.status === "En Revisión").length;
          }
        }

        allDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentDocuments(allDocuments.slice(0, 5));
        setDocumentsInReview(inReviewCount);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const title = `¡Bienvenido, ${user?.username ?? ""}!`;
  const description = "Gestiona tus proyectos y documentos en un único lugar";

  if (loading) {
    return (
      <AppLayout title={title} description={description}>
        <SkeletonStats count={3} />
        <div className="mt-6">
          <SkeletonRows count={5} />
        </div>
      </AppLayout>
    );
  }

  const actions = (
    <>
      <PermissionGate permission="CREATE_PROJECT">
        <Button onClick={() => navigate("/student/projects/view")}>
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          Crear proyecto
        </Button>
      </PermissionGate>

      <PermissionGate permission="CREATE_DOCUMENT">
        <Button variant="secondary" onClick={() => navigate("/student/projects/view")}>
          <Upload className="h-4 w-4" strokeWidth={1.8} />
          Subir documento
        </Button>
      </PermissionGate>

      <Button variant="ghost" onClick={() => navigate("/student/projects/view")}>
        Ver mis proyectos
      </Button>
    </>
  );

  return (
    <AppLayout title={title} description={description} actions={actions}>
      <motion.div {...fadeIn} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Proyectos activos" value={projects.length} icon={FolderKanban} />
        <StatCard
          label="Documentos totales"
          value={recentDocuments.length}
          icon={FileText}
          tone="info"
        />
        <StatCard label="En revisión" value={documentsInReview} icon={Clock} tone="warn" />
      </motion.div>

      {error && (
        <div className="mt-6 rounded-xl border border-line bg-danger-wash p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <motion.div {...fadeIn} className="mt-6">
        <Card>
          <CardHeader
            title="Proyectos activos"
            description={`${projects.length} proyecto(s)`}
          />

          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No tienes proyectos activos"
              description="Crea tu primer proyecto para empezar a subir documentos."
              action={
                <PermissionGate permission="CREATE_PROJECT">
                  <Button onClick={() => navigate("/student/projects/view")}>
                    <Plus className="h-4 w-4" strokeWidth={1.8} />
                    Crear proyecto
                  </Button>
                </PermissionGate>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map(project => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="font-display font-semibold text-content">{project.title}</h3>
                    {project.status && <Badge status={project.status} />}
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-muted">
                    {project.description || "Sin descripción"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Tutor: {project.tutor?.username || "No asignado"}</span>
                    <span className="font-mono">{formatDate(project.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div {...fadeIn} className="mt-6">
        <Card padded={false}>
          <div className="p-6 pb-0">
            <CardHeader
              title="Documentos recientes"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/student/projects/view")}
                >
                  Ver historial
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </Button>
              }
            />
          </div>

          {recentDocuments.length === 0 ? (
            <div className="p-6 pt-0">
              <EmptyState
                icon={FileText}
                title="No hay documentos aún"
                description="Los documentos que subas a tus proyectos aparecerán aquí."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Documento</th>
                    <th className="px-6 py-3 text-left font-medium">Proyecto</th>
                    <th className="px-6 py-3 text-left font-medium">Estado</th>
                    <th className="px-6 py-3 text-left font-medium">Fecha</th>
                    <th className="px-6 py-3 text-left font-medium">Versión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentDocuments.map(doc => (
                    <tr
                      key={doc.id}
                      onClick={() => navigate(`/document/${doc.id}`)}
                      className="cursor-pointer transition-colors hover:bg-surface-2"
                    >
                      <td className="px-6 py-4 font-medium text-content">{doc.title}</td>
                      <td className="px-6 py-4 text-muted">{doc.projectTitle}</td>
                      <td className="px-6 py-4">
                        <Badge status={doc.status || "Subido"} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-6 py-4 tabular text-muted">v{doc.version || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </AppLayout>
  );
}

export default StudentDashboard;
