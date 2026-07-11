import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { getAllProjects, getAllUsers, assignTutorToProject } from "../core/Projects";
import { getDocumentsByProjectId } from "../core/Document";
import { motion } from "framer-motion";

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

  const getStatusColor = (status) => {
    switch (status) {
      case "Creado":
        return "bg-gray-100 text-gray-800";
      case "En Revisión":
        return "bg-blue-100 text-blue-800";
      case "Aprobado":
        return "bg-green-100 text-green-800";
      case "Finalizado":
        return "bg-green-100 text-green-800";
      case "Rechazado":
        return "bg-red-100 text-red-800";
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

  const getTutorMostLoaded = () => {
    if (Object.keys(tutorLoadMap).length === 0) return null;
    const [tutorId] = Object.entries(tutorLoadMap).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );
    return tutors.find(t => t.id === parseInt(tutorId));
  };

  if (loading) {
    return (
      <div className="Coordinator">
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

  const tutorMostLoaded = getTutorMostLoaded();

  return (
    <div className="Coordinator">
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
              Panel de Coordinación, {user?.username}
            </h1>
            <p className="text-gray-600">
              Supervisa proyectos y gestiona la carga de tutores
            </p>
          </motion.div>

          {/* Metrics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Proyectos</p>
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
                  <p className="text-gray-600 text-sm font-medium">Total Estudiantes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{students.length}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Tutores</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{tutors.length}</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Docs. Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{pendingDocuments}</p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Report Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Documentos Pendientes</h3>
              <p className="text-3xl font-bold text-orange-600 mb-2">{pendingDocuments}</p>
              <p className="text-gray-600 text-sm">Documentos en revisión o recién subidos</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tutor con Mayor Carga</h3>
              {tutorMostLoaded ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">{tutorMostLoaded.username}</p>
                  <p className="text-gray-600 text-sm">
                    {tutorLoadMap[tutorMostLoaded.id]} proyecto(s) asignado(s)
                  </p>
                </>
              ) : (
                <p className="text-gray-500 text-sm">No hay tutores asignados</p>
              )}
            </div>
          </motion.div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-3 mb-8"
          >
            <button
              onClick={() => navigate("/audit-logs")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Ver Auditoría
            </button>
          </motion.div>

          {/* Projects Table Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Proyectos</h2>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => handleFilterChange(e.target.value, filterTutor, filterDate)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="Creado">Creado</option>
                    <option value="En Revisión">En Revisión</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tutor</label>
                  <select
                    value={filterTutor}
                    onChange={(e) => handleFilterChange(filterStatus, e.target.value, filterDate)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    {tutors.map(tutor => (
                      <option key={tutor.id} value={tutor.id}>
                        {tutor.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <select
                    value={filterDate}
                    onChange={(e) => handleFilterChange(filterStatus, filterTutor, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Cualquier fecha</option>
                    <option value="7">Últimos 7 días</option>
                    <option value="30">Últimos 30 días</option>
                    <option value="90">Últimos 90 días</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay proyectos que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Proyecto</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tutor</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProjects.map(project => (
                      <motion.tr
                        key={project.id}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        className="cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{project.attributes.title}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="line-clamp-2">{project.attributes.description || "Sin descripción"}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {project.attributes.tutor?.data?.attributes?.username || "No asignado"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusBadgeClass(project.attributes.status || "Creado")}>
                            {project.attributes.status || "Creado"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(project.attributes.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/project/${project.id}`)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProject(project);
                                setSelectedTutorForAssign(project.attributes.tutor?.data?.id || "");
                                setAssignModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                              Asignar Tutor
                            </button>
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

      {/* Assign Tutor Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Asignar Tutor
            </h2>
            <p className="text-gray-600 mb-4">
              Proyecto: <strong>{selectedProject?.attributes.title}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona un tutor
              </label>
              <select
                value={selectedTutorForAssign}
                onChange={(e) => setSelectedTutorForAssign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Selecciona --</option>
                {tutors.map(tutor => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.username} ({tutorLoadMap[tutor.id] || 0} proyectos)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedProject(null);
                  setSelectedTutorForAssign("");
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignTutor}
                disabled={assignLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {assignLoading ? "Asignando..." : "Asignar"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default CoordinatorDashboard;
