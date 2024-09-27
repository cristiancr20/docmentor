import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDocumentsByProjectId, deleteDocument } from "../core/Document"; // Asegúrate de agregar deleteDocument a tus funciones core
import { getProjectById } from "../core/Projects";
import Navbar from "../components/Navbar";
import SubirDocumento from "../components/SubirDocumento";
import { motion } from "framer-motion";

import Swal from "sweetalert2";

const ProyectoDetalle = () => {
  const { projectId } = useParams(); // Obtén el ID del proyecto de la URL

  const [documents, setDocuments] = useState([]);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la visibilidad del modal
  const rol = localStorage.getItem("rol");

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const projectDetails = await getProjectById(projectId);
      setProject(projectDetails);

      const documentsResponse = await getDocumentsByProjectId(projectId);
      setDocuments(documentsResponse.data);
    } catch (error) {
      setError("Error fetching project details");
      console.error("Error fetching project details:", error);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar!",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Llamada a la función para eliminar el documento y las notificaciones
          await deleteDocument(documentId);

          // Volver a cargar los documentos después de la eliminación
          fetchProject();
          Swal.fire("Eliminado!", "El documento ha sido eliminado.", "success");
        } catch (error) {
          console.error("Error deleting document:", error);
          Swal.fire(
            "Error!",
            "Hubo un problema al eliminar el documento.",
            "error"
          );
        }
      }
    });
  };

  if (!project) {
    return <p>Cargando detalles del proyecto...</p>;
  }

  const { attributes } = project;
  const tutor = attributes.tutor?.data?.attributes || {};
  const estudiante = attributes.estudiante?.data?.attributes || {};

  const closeModal = () => {
    setIsModalOpen(false);
    // Opcionalmente, podrías volver a cargar los documentos aquí si es necesario
    fetchProject();
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold mb-4"
        >
          {attributes.Title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg mb-4"
        >
          {attributes.Descripcion}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-md text-gray-700 mb-6"
        >
          Fecha de Creación:{" "}
          <span className="font-semibold">{attributes.FechaCreacion}</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-semibold mb-2 border-b-2 border-gray-300 pb-2">
            Tutor:
          </h2>
          <p className="text-md text-gray-800">
            Nombre: <span className="font-medium">{tutor.username}</span>
          </p>
          <p className="text-md text-gray-800">
            Email: <span className="font-medium">{tutor.email}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 border-b-2 border-gray-300 pb-2">
            Estudiante:
          </h2>
          <p className="text-md text-gray-800">
            Nombre: <span className="font-medium">{estudiante.username}</span>
          </p>
          <p className="text-md text-gray-800">
            Email: <span className="font-medium">{estudiante.email}</span>
          </p>
        </motion.div>

        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            
          className="text-2xl font-semibold mb-4 border-b-2 border-gray-300 pb-2">
            Historial de Versiones:
          </motion.h2>

          {rol === "estudiante" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mb-4 bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Subir Nuevo Documento
            </button>
          )}

          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Fecha de Subida
                    </th>
                    <th className="px-6 py-3 bg-gray-100"></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, index) => {
                    // Determina el color de fondo de la fila basado en el estado del documento
                    const rowColor =
                      doc.attributes.revisado === false
                        ? "bg-yellow-100" // Amarillo claro para pendiente
                        : doc.attributes.revisado === true
                          ? "bg-green-100" // Verde claro para revisado
                          : index % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50";

                    return (
                      <tr
                        key={doc.id}
                        className={`${rowColor} ${
                          index % 2 === 0 && doc.attributes.revisado === null
                            ? "bg-gray-50"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {doc.attributes.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.attributes.revisado === false
                            ? "Pendiente de revisión"
                            : doc.attributes.revisado === true
                              ? "Revisado"
                              : "Sin estado"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.attributes.fechaSubida || "No disponible"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {doc.attributes.documentFile?.data?.length > 0 &&
                          doc.attributes.documentFile.data[0]?.attributes
                            ?.url ? (
                            <a
                              href={`/documento/${doc.id}`} // Cambia aquí para redirigir al visor de documentos
                              className="text-blue-600 hover:underline"
                            >
                              Ver Documento
                            </a>
                          ) : (
                            <span className="text-gray-500">
                              No hay documento
                            </span>
                          )}
                          {rol === "estudiante" && (
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              title="Eliminar"
                              className="text-red-600 hover:underline ml-4"
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-md text-gray-600">
              No hay versiones disponibles.
            </p>
          )}
        </div>
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }} 
        className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex items-center text-gray-900 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md px-4 py-2 transition duration-150 ease-in-out bg-red-500"
            >
              <svg
                className="w-5 h-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cerrar
            </button>

            <SubirDocumento projectId={projectId} onClose={closeModal} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProyectoDetalle;
