import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { PermissionGate } from "../components/PermissionGate";
import { useAuth } from "../context/AuthContext";
import { getProjectsByStudents } from "../core/Projects";
import { getDocumentsByProjectId } from "../core/Document";
import { decryptData } from "../utils/encryption";
import { motion } from "framer-motion";

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

  if (loading) {
    return (
      <div className="Students">
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
    <div className="Students">
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
              ¡Bienvenido, {user?.username}!
            </h1>
            <p className="text-gray-600">
              Gestiona tus proyectos y documentos en un único lugar
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
                  <p className="text-gray-600 text-sm font-medium">Proyectos Activos</p>
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
                  <p className="text-3xl font-bold text-gray-900 mt-2">{recentDocuments.length}</p>
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
                  <p className="text-3xl font-bold text-blue-600 mt-2">{documentsInReview}</p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-3 mb-8"
          >
            <PermissionGate permission="CREATE_PROJECT">
              <button
                onClick={() => navigate("/student/projects/view")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                + Crear Proyecto
              </button>
            </PermissionGate>

            <PermissionGate permission="CREATE_DOCUMENT">
              <button
                onClick={() => navigate("/student/projects/view")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                ⬆ Subir Documento
              </button>
            </PermissionGate>

            <button
              onClick={() => navigate("/student/projects/view")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Ver Mis Proyectos
            </button>
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
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Proyectos Activos</h2>
              <span className="text-gray-500 text-sm">{projects.length} proyecto(s)</span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No tienes proyectos activos</p>
                <PermissionGate permission="CREATE_PROJECT">
                  <button
                    onClick={() => navigate("/student/projects/view")}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Crear tu primer proyecto
                  </button>
                </PermissionGate>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(project => (
                  <motion.div
                    key={project.id}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1">{project.title}</h3>
                      {project.status && (
                        <span className={getStatusBadgeClass(project.status)}>
                          {project.status}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {project.description || "Sin descripción"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Tutor: {project.tutor?.username || "No asignado"}</span>
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Documents Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Documentos Recientes</h2>
              <button
                onClick={() => navigate("/student/projects/view")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver Historial →
              </button>
            </div>

            {recentDocuments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay documentos aún</p>
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
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Versión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentDocuments.map(doc => (
                      <motion.tr
                        key={doc.id}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        onClick={() => navigate(`/document/${doc.id}`)}
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
                          {formatDate(doc.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          v{doc.version || 1}
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

export default StudentDashboard;
