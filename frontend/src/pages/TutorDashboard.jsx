import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Card, { CardHeader } from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { Select } from "../components/ui/Input";
import { SkeletonStats, SkeletonRows } from "../components/ui/Skeleton";
import { PermissionGate } from "../components/PermissionGate";
import { useAuth } from "../context/AuthContext";
import { getProjectsByTutor } from "../core/Projects";
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

function TutorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentsAwaitingReview, setDocumentsAwaitingReview] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("date");
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
        const tutorProjects = await getProjectsByTutor(userEmail);
        setProjects(tutorProjects);

        const allDocuments = [];
        let awaitingReviewCount = 0;

        for (const project of tutorProjects) {
          const projectDocuments = await getDocumentsByProjectId(project.id);
          if (projectDocuments.data) {
            const docsList = projectDocuments.data.map(doc => ({
              ...doc.attributes,
              id: doc.id,
              projectId: project.id,
              projectTitle: project.title
            }));
            allDocuments.push(...docsList);
            awaitingReviewCount += docsList.filter(doc => doc.status === "En Revisión").length;
          }
        }

        sortDocuments(allDocuments, "date");
        setDocuments(allDocuments);
        setDocumentsAwaitingReview(awaitingReviewCount);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortDocuments = (docs, sortType) => {
    const sorted = [...docs];
    if (sortType === "date") {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortType === "urgent") {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      sorted.sort((a, b) => {
        const aOld = new Date(a.createdAt) < sevenDaysAgo;
        const bOld = new Date(b.createdAt) < sevenDaysAgo;
        if (aOld !== bOld) return aOld ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }
    return sorted;
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const sorted = sortDocuments(documents, newSort);
    setDocuments(sorted);
  };

  const isDocumentUrgent = (createdDate) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new Date(createdDate) < sevenDaysAgo;
  };

  const getDaysAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const title = `Panel de revisión, ${user?.username ?? ""}`;
  const description = "Revisa proyectos y documentos asignados";

  if (loading) {
    return (
      <AppLayout title={title} description={description}>
        <SkeletonStats count={3} />
        <div className="mt-6">
          <SkeletonRows count={6} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={title} description={description}>
      <motion.div {...fadeIn} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Proyectos asignados" value={projects.length} icon={FolderKanban} />
        <StatCard
          label="Documentos totales"
          value={documents.length}
          icon={FileText}
          tone="info"
        />
        <StatCard label="En revisión" value={documentsAwaitingReview} icon={Clock} tone="warn" />
      </motion.div>

      {error && (
        <div className="mt-6 rounded-xl border border-line bg-danger-wash p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <motion.div {...fadeIn} className="mt-6">
        <Card padded={false}>
          <div className="p-6 pb-0">
            <CardHeader
              title="Proyectos asignados"
              description={`${projects.length} proyecto(s)`}
            />
          </div>

          {projects.length === 0 ? (
            <div className="p-6 pt-0">
              <EmptyState
                icon={FolderKanban}
                title="No hay proyectos asignados"
                description="Cuando la coordinación te asigne un proyecto, lo verás aquí."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Proyecto</th>
                    <th className="px-6 py-3 text-left font-medium">Descripción</th>
                    <th className="px-6 py-3 text-left font-medium">Estado</th>
                    <th className="px-6 py-3 text-left font-medium">Creación</th>
                    <th className="px-6 py-3 text-left font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {projects.map(project => (
                    <tr key={project.id} className="transition-colors hover:bg-surface-2">
                      <td className="px-6 py-4 font-medium text-content">{project.title}</td>
                      <td className="px-6 py-4 text-muted">
                        <span className="line-clamp-2">
                          {project.description || "Sin descripción"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={project.status || "Creado"} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted">
                        {formatDate(project.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/project/${project.id}`)}
                        >
                          Ver detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div {...fadeIn} className="mt-6">
        <Card padded={false}>
          <div className="p-6 pb-0">
            <CardHeader
              title="Documentos por revisar"
              action={
                <Select
                  id="tutor-sort"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-48"
                >
                  <option value="date">Más reciente</option>
                  <option value="urgent">Requiere atención</option>
                </Select>
              }
            />
          </div>

          {documents.length === 0 ? (
            <div className="p-6 pt-0">
              <EmptyState
                icon={FileText}
                title="No hay documentos disponibles"
                description="Los documentos de tus proyectos aparecerán aquí para revisión."
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
                    <th className="px-6 py-3 text-left font-medium">Urgencia</th>
                    <th className="px-6 py-3 text-left font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {documents.map(doc => (
                    <tr key={doc.id} className="transition-colors hover:bg-surface-2">
                      <td className="px-6 py-4 font-medium text-content">{doc.title}</td>
                      <td className="px-6 py-4 text-muted">{doc.projectTitle}</td>
                      <td className="px-6 py-4">
                        <Badge status={doc.status || "Subido"} />
                      </td>
                      <td className="px-6 py-4 text-muted">
                        <span className="font-mono text-xs">{formatDate(doc.createdAt)}</span>
                        <span className="ml-1 tabular text-xs">
                          ({getDaysAgo(doc.createdAt)} días)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isDocumentUrgent(doc.createdAt) ? (
                          <Badge tone="danger">
                            <AlertTriangle className="mr-1 h-3.5 w-3.5" strokeWidth={1.8} />
                            Urgente
                          </Badge>
                        ) : (
                          <Badge tone="ok">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" strokeWidth={1.8} />
                            Normal
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/document/${doc.id}`)}
                          >
                            Ver
                          </Button>
                          <PermissionGate permission="REVIEW_DOCUMENT">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/document/${doc.id}`)}
                            >
                              Revisar
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="COMMENT_DOCUMENT">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/document/${doc.id}`)}
                            >
                              Comentar
                            </Button>
                          </PermissionGate>
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
    </AppLayout>
  );
}

export default TutorDashboard;
