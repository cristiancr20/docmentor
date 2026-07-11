import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { getAuditLogs } from "../core/Audit";
import { motion } from "framer-motion";

function AuditLogs() {
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterEntityType, setFilterEntityType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filterEntityType]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        pageSize: 50,
      };

      if (filterEntityType !== "all") {
        filters.entityType = filterEntityType;
      }

      const response = await getAuditLogs(filters);
      setAuditLogs(response.data || []);
      setTotalPages(response.meta?.pagination?.pageCount || 1);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("es-ES");
  };

  const getActionColor = (action) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "change_status":
        return "bg-purple-100 text-purple-800";
      case "anonymize":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionBadgeClass = (action) => {
    const baseClasses = "inline-block px-3 py-1 rounded-full text-sm font-medium";
    return `${baseClasses} ${getActionColor(action)}`;
  };

  if (loading) {
    return (
      <div className="AuditLogs">
        <Navbar />
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando registros de auditoría...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="AuditLogs">
      <Navbar />
      <Header />
      <main className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Registros de Auditoría
              </h1>
              <p className="text-gray-600">
                Historial de cambios en proyectos y documentos
              </p>
            </div>
            <button
              onClick={() => navigate("/coordinator/dashboard")}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              ← Volver
            </button>
          </motion.div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
              {error}
            </div>
          )}

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Entidad
                </label>
                <select
                  value={filterEntityType}
                  onChange={(e) => {
                    setFilterEntityType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="project">Proyectos</option>
                  <option value="document">Documentos</option>
                  <option value="user">Usuarios</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Audit Logs Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            {auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay registros de auditoría</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Acción
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Entidad
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Detalles
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {auditLogs.map(log => (
                        <motion.tr
                          key={log.id}
                          whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          className="cursor-pointer"
                        >
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(log.attributes.timestamp)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={getActionBadgeClass(log.attributes.action)}>
                              {log.attributes.action.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div>
                              <p className="font-medium">{log.attributes.entityType}</p>
                              <p className="text-xs text-gray-500">ID: {log.attributes.entityId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {log.attributes.userId || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-800 font-medium">
                                Ver cambios
                              </summary>
                              <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 max-h-40 overflow-auto">
                                {log.attributes.oldValue && (
                                  <div className="mb-2">
                                    <p className="font-semibold text-gray-700">Anterior:</p>
                                    <pre className="whitespace-pre-wrap break-words">
                                      {typeof log.attributes.oldValue === "string"
                                        ? log.attributes.oldValue
                                        : JSON.stringify(log.attributes.oldValue, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.attributes.newValue && (
                                  <div>
                                    <p className="font-semibold text-gray-700">Nuevo:</p>
                                    <pre className="whitespace-pre-wrap break-words">
                                      {typeof log.attributes.newValue === "string"
                                        ? log.attributes.newValue
                                        : JSON.stringify(log.attributes.newValue, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default AuditLogs;
