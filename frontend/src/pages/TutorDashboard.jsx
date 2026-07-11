import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { PermissionGate } from "../components/PermissionGate";
import { useAuth } from "../context/AuthContext";
import { getProjectsByTutor } from "../core/Projects";
import { getDocumentsByProjectId } from "../core/Document";
import { decryptData } from "../utils/encryption";
import { motion } from "framer-motion";

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
    const decryptedUserData = JSON.parse(decryptData(encryptedUserData));
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Creado":
      case "Subido":
        return "bg-gray-100 text-gray-800";
      case "En Revisión":
        return "bg-blue-100 text-blue-800";
      case "Aprobado":
        return "bg-green-100 text-green-800";
      case "Rechazado":
      case "Cambios Solicitados":
        return "bg-red-100 text-red-800";
      case "Archivado":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeClass = (status) => {
    const baseClasses = "inline-block px-3 py-1 rounded-full text-sm font-medium";
    return `${baseClasses} ${getStatusColor(status)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  const getDaysAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="Tutor">
        <Navbar />
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="Tutor">
      <Navbar />
      <Header />
      <main className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Panel de Revisión, {user?.username}
            </h1>
            <p className="text-gray-600">
              Revisa proyectos y documentos asignados
            </p>
          </motion.div>

          {/* Metrics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Proyectos Asignados</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{projects.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Documentos Totales</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{documents.length}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">En Revisión</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{documentsAwaitingReview}</p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
              {error}
            </div>
          )}

          {/* Projects Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Proyectos Asignados</h2>
              <span className="text-gray-500 text-sm">{projects.length} proyecto(s)</span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay proyectos asignados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Proyecto</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha de Creación</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projects.map(project => (
                      <motion.tr
                        key={project.id}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        className="cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{project.title}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="line-clamp-2">{project.description || "Sin descripción"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusBadgeClass(project.status || "Creado")}>
                            {project.status || "Creado"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(project.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/project/${project.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Ver Detalles →
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Documents Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Documentos por Revisar</h2>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Más Reciente</option>
                  <option value="urgent">Requiere Atención</option>
                </select>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay documentos disponibles</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Documento</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Proyecto</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Urgencia</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents.map(doc => (
                      <motion.tr
                        key={doc.id}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        className="cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{doc.title}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {doc.projectTitle}
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusBadgeClass(doc.status || "Subido")}>
                            {doc.status || "Subido"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(doc.createdAt)} ({getDaysAgo(doc.createdAt)} días)
                        </td>
                        <td className="px-6 py-4">
                          {isDocumentUrgent(doc.createdAt) ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Urgente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/document/${doc.id}`)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Ver
                            </button>
                            <PermissionGate permission="REVIEW_DOCUMENT">
                              <button
                                onClick={() => navigate(`/document/${doc.id}`)}
                                className="text-green-600 hover:text-green-800 font-medium text-sm"
                              >
                                Revisar
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="COMMENT_DOCUMENT">
                              <button
                                onClick={() => navigate(`/document/${doc.id}`)}
                                className="text-orange-600 hover:text-orange-800 font-medium text-sm"
                              >
                                Comentar
                              </button>
                            </PermissionGate>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default TutorDashboard;
