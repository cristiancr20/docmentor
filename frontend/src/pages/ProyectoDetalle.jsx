import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Copy,
  FileText,
  GitCompare,
  Route,
  Upload,
  User,
  Users,
} from "lucide-react";
import { copyDocumentAsNewVersion, getDocumentsByProjectId } from "../core/Document";
import { getProjectById } from "../core/Projects";
import AppLayout from "../components/layout/AppLayout";
import Card, { CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Skeleton, { SkeletonRows } from "../components/ui/Skeleton";
import SubirDocumento from "../components/SubirDocumento";
import { warningAlert } from "../components/Alerts/Alerts";
import GeneratePdfButton from "../components/GeneratePdfButton";
import DocumentComparePopup from "../components/DocumentComparePopup";
import ProjectsTable from "../components/ProjectsTable";
import { usePermission } from "../context/PermissionContext";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/format";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

const ProyectoDetalle = () => {
  const { projectId } = useParams(); // Obtén el ID del proyecto de la URL

  const [documents, setDocuments] = useState([]);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la visibilidad del modal
  const [isShowComparePopupOpen, setShowIsComparePopupOpen] = useState(false);
  // Con la lista vacía esto valía -2, un índice fuera de rango que hacía
  // reventar el comparador.
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, documents.length - 2));
  const { hasPermission } = usePermission();
  const { user } = useAuth();

  const canReviewDocuments = hasPermission("REVIEW_DOCUMENT");
  const canUploadDocuments = hasPermission("CREATE_DOCUMENT");

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const projectDetails = await getProjectById(projectId);
      setProject(projectDetails);

      const documentsResponse = await getDocumentsByProjectId(projectId);
      const fetchedDocuments = documentsResponse.data;
      setDocuments(fetchedDocuments);

      if (fetchedDocuments.length > 1) {
        setCurrentIndex(fetchedDocuments.length - 2);
      } else {
        setCurrentIndex(0); // Manejo seguro en caso de que haya solo un documento
      }
    } catch (error) {
      setError("Error al cargar los detalles del proyecto");
      console.error("Error fetching project details:", error);
    }
  };

  const handleCompareClick = () => {
    if (documents.length > 1) {
      setShowIsComparePopupOpen(true);
      setCurrentIndex(documents.length - 2);
    } else {
      warningAlert("No existen los documentos suficientes para comparar");
    }
  };

  const backLink = (
    <Link
      to={canReviewDocuments ? "/tutor/projects/view" : "/student/projects/view"}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface-2 px-4 text-sm font-medium text-content transition-colors hover:border-line-strong"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
      Volver a los proyectos
    </Link>
  );

  if (!project) {
    return (
      <AppLayout title="Detalle del proyecto" description="Cargando información del proyecto…">
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-52 lg:col-span-2" />
          <Skeleton className="h-52" />
        </div>
        <div className="mt-6">
          <SkeletonRows count={4} />
        </div>
      </AppLayout>
    );
  }

  const { attributes } = project;
  const tutor = attributes.tutor?.data?.attributes || {};
  // Acceder a los estudiantes (iterar sobre el array)
  const estudiantes =
    attributes.students?.data?.map((estudiante) => {
      return estudiante.attributes;
    }) || [];

  // Ambos son cadenas. El fallback era `{}`, que al ser truthy pasaba el
  // `itinerario || "..."` de la vista y React reventaba con "Objects are not
  // valid as a React child"; y `tipoProyecto === "Grupal"` nunca era cierto.
  const itinerario = attributes.itinerary || "";
  const tipoProyecto = attributes.projectType || "";

  const closeModal = () => {
    setIsModalOpen(false);
    // Opcionalmente, podrías volver a cargar los documentos aquí si es necesario
    fetchProject();
  };

  const copyDocumentNewVersion = async (documentId) => {
    await copyDocumentAsNewVersion(documentId);
    fetchProject();
  };

  const columns = [
    {
      key: "title",
      label: "Documento",
      render: (doc) => (
        <span className="font-medium text-content">{doc.attributes.title}</span>
      ),
    },
    {
      key: "version",
      label: "Versión",
      render: (doc) => {
        const version = doc.attributes.version;
        const previousVersion = doc.attributes.previous_version?.data?.attributes?.version;

        return (
          <div className="flex flex-col gap-0.5">
            <span className="tabular text-content">v{version}</span>
            <span className="text-xs text-muted">
              {previousVersion ? `Copia de v${previousVersion}` : "Documento nuevo"}
            </span>
          </div>
        );
      },
    },
    {
      key: "isCurrent",
      label: "Actual",
      render: (doc) =>
        doc.attributes.isCurrent ? (
          <Badge tone="ok">Versión actual</Badge>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "isRevised",
      label: "Estado",
      render: (doc) => {
        if (doc.attributes.isRevised === true) return <Badge tone="ok">Revisado</Badge>;
        if (doc.attributes.isRevised === false)
          return <Badge tone="warn">Pendiente de revisión</Badge>;
        return <Badge tone="neutral">Sin estado</Badge>;
      },
    },
    {
      key: "publishedAt",
      label: "Fecha de subida",
      render: (doc) => (
        <span className="whitespace-nowrap font-mono text-xs text-muted">
          {formatDateTime(doc.attributes.publishedAt)}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (doc) => (
        <div className="flex items-center gap-2">
          {/* Ver documento */}
          {doc.attributes.documentFile?.data?.length > 0 ? (
            <Link
              to={`/document/${doc.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-soft"
            >
              <FileText className="h-4 w-4" strokeWidth={1.8} />
              Ver documento
            </Link>
          ) : (
            <span className="text-sm text-muted">No hay documento</span>
          )}

          {/* Botón para crear nueva versión */}
          {hasPermission("REVIEW_DOCUMENT") && (
            <Button variant="secondary" size="sm" onClick={() => copyDocumentNewVersion(doc.id)}>
              <Copy className="h-4 w-4" strokeWidth={1.8} />
              Nueva versión
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout title={attributes.title} description={itinerario || "Detalle del proyecto"} actions={backLink}>
      {error && (
        <div className="mb-6 rounded-xl border border-line bg-danger-wash p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <motion.div {...fadeIn} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Descripción del proyecto" />

          <p className="text-sm leading-relaxed text-muted">
            {attributes.description || "Sin descripción"}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-4">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted" strokeWidth={1.8} />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Creación del proyecto
                </dt>
                <dd className="mt-1 font-mono text-sm text-content">
                  {formatDateTime(attributes.publishedAt)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-4">
              <Route className="mt-0.5 h-5 w-5 shrink-0 text-muted" strokeWidth={1.8} />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Itinerario
                </dt>
                <dd className="mt-1 text-sm text-content">
                  {itinerario || "Itinerario no especificado"}
                </dd>
              </div>
            </div>
          </dl>
        </Card>

        {/* Sección del tutor o de los estudiantes según el rol */}
        {canReviewDocuments ? (
          <Card>
            <CardHeader
              title="Estudiantes"
              description={tipoProyecto === "Grupal" ? "Proyecto en pareja" : "Proyecto individual"}
            />

            <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-accent-wash text-accent">
              {tipoProyecto === "Grupal" ? (
                <Users className="h-5 w-5" strokeWidth={1.8} />
              ) : (
                <User className="h-5 w-5" strokeWidth={1.8} />
              )}
            </div>

            <ul className="flex flex-col gap-2">
              {estudiantes.map((estudiante) => (
                <li
                  key={estudiante.email || estudiante.username}
                  className="rounded-xl border border-line bg-surface-2 p-3"
                >
                  <p className="truncate text-sm font-medium text-content">
                    {estudiante.username || "Nombre no disponible"}
                  </p>
                  <p className="truncate font-mono text-xs text-muted">
                    {estudiante.email || "Correo no disponible"}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Tutor del proyecto" />

            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-wash text-accent">
                <User className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-content">
                  {tutor.username || "Tutor no asignado"}
                </p>
                <p className="truncate font-mono text-xs text-muted">{tutor.email || "—"}</p>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      <motion.div {...fadeIn} className="mt-6">
        <Card padded={false}>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-content">
                Historial de versiones
              </h2>
              <p className="mt-1 text-sm text-muted">
                {documents.length} documento(s) en este proyecto
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canUploadDocuments && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Upload className="h-4 w-4" strokeWidth={1.8} />
                  Subir nuevo documento
                </Button>
              )}

              <Button variant="secondary" onClick={handleCompareClick}>
                <GitCompare className="h-4 w-4" strokeWidth={1.8} />
                Comparar versiones
              </Button>

              {(canReviewDocuments || canUploadDocuments) && (
                <GeneratePdfButton
                  project={attributes}
                  documents={documents}
                  generatedBy={user?.name || user?.email || "Usuario"}
                />
              )}
            </div>
          </div>

          <div className="p-6">
            <ProjectsTable
              projects={documents}
              columns={columns}
              emptyTitle="Aún no hay documentos"
              emptyDescription="Sube la primera versión para empezar el historial del proyecto."
            />
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isShowComparePopupOpen && (
          <DocumentComparePopup
            documents={documents}
            onClose={() => setShowIsComparePopupOpen(false)}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />
        )}
      </AnimatePresence>

      {/* Modal para subir documento */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Subir documento"
        description="Adjunta la nueva versión en formato PDF"
        size="sm"
      >
        <SubirDocumento projectId={projectId} onClose={closeModal} />
      </Modal>
    </AppLayout>
  );
};

export default ProyectoDetalle;
