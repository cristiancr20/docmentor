import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDocumentsByProjectId } from "../core/Document"; // Asegúrate de agregar deleteDocument a tus funciones core
import { getProjectById } from "../core/Projects";
import Navbar from "../components/Navbar";
import SubirDocumento from "../components/SubirDocumento";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle } from "lucide-react";
import { errorAlert } from "../components/Alerts/Alerts";

import DocumentComparePopup from "../components/DocumentComparePopup";

const ProyectoDetalle = () => {
  const { projectId } = useParams(); // Obtén el ID del proyecto de la URL

  const [documents, setDocuments] = useState([]);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la visibilidad del modal
  const rol = localStorage.getItem("rol");
  const [isShowComparePopupOpen, setShowIsComparePopupOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(documents.length - 2);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const projectDetails = await getProjectById(projectId);
      setProject(projectDetails);
      console.log(projectDetails);

      const documentsResponse = await getDocumentsByProjectId(projectId);
      const fetchedDocuments = documentsResponse.data;
      setDocuments(fetchedDocuments);

      if (fetchedDocuments.length > 1) {
        setCurrentIndex(fetchedDocuments.length - 2);
      } else {
        setCurrentIndex(0); // Manejo seguro en caso de que haya solo un documento
      }
    } catch (error) {
      setError("Error fetching project details");
      console.error("Error fetching project details:", error);
    }
  };

  const handleCompareClick = () => {
    if (documents.length > 1) {
      setShowIsComparePopupOpen(true);
      setCurrentIndex(documents.length - 2);
    } else {
      errorAlert("No existen los documentos suficientes para comparar");
    }
  };

  const closeComparePopup = () => {
    setShowIsComparePopupOpen(false);
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
        <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-50 rounded-lg shadow-md">
          {/* Sección de información del proyecto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: project ? 1 : 0.5, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold mb-4 text-gray-900 border-b pb-4 text-center"
            >
              {project ? attributes.Title : "Cargando..."}
            </motion.h1>

            <h2 className="text-2xl font-bold ">Descripción del Proyecto:</h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-lg mb-4 text-gray-700 leading-relaxed"
            >
              {attributes.Descripcion}
            </motion.p>

            <div className="flex items-center">
              <h2 className="text-1xl font-bold mr-4">
                Fecha de Creación del Proyecto:
              </h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700"
              >
                <span>{attributes.FechaCreacion}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Sección del tutor */}
          {rol === "estudiante" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:w-80 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 border border-blue-100"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-500 text-white rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-md">
                    <UserCircle className="w-12 h-12" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-800">
                      Tutor del Proyecto
                    </h2>
                    <p className="text-lg font-semibold text-blue-600">
                      {tutor.username}
                    </p>
                    <div className="flex flex-col items-center text-center">
                      <div className="flex items-center m-1">
                        <h3 className="text-sm font-semibold text-gray-800">
                          Correo:
                        </h3>
                        <p className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700">
                          {tutor.email}
                        </p>
                      </div>
                      {/* <div className="flex items-center m-1">
                        <h3 className="text-sm font-semibold text-gray-800">
                          Carrera:
                        </h3>
                        <p className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700">
                          {tutor.carrera}
                        </p>
                      </div> */}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {rol === "tutor" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:w-80 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 border border-blue-100"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-500 text-white rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-md">
                    <UserCircle className="w-12 h-12" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-800">
                      Estudiante
                    </h2>
                    <p className="text-lg font-semibold text-blue-600">
                      {estudiante.username}
                    </p>

                    <div className="flex flex-col items-center text-end">
                      <div className="flex items-center m-1">
                        <h3 className="text-sm font-semibold text-gray-800">
                          Correo:
                        </h3>
                        <p className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700">
                          {estudiante.email}
                        </p>
                      </div>

                      <div className="flex items-center m-1">
                        <h3 className="text-sm font-semibold text-gray-800">
                          Itineario:
                        </h3>
                        <p className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700">
                          {estudiante.itinerario}
                        </p>
                      </div>

                      {/* <div className="flex items-center m-1">
                        <h3 className="text-sm font-semibold text-gray-800">
                          Carrera:
                        </h3>
                        <p className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700">
                          {estudiante.carrera}
                        </p>
                      </div> */}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>

        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-semibold mb-4 border-b-2 border-gray-300 pb-2 mt-5"
          >
            Historial de Versiones:
          </motion.h2>

          {rol === "estudiante" && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              onClick={() => setIsModalOpen(true)}
              className="mb-4 bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Subir Nuevo Documento
            </motion.button>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onClick={handleCompareClick}
            className="mb-4 ml-4 bg-red-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700"
          >
            Comparar Versiones
          </motion.button>

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
                      <motion.tr
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
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
                        </td>
                      </motion.tr>
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
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4 md:p-6"
          >
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Subir Documento
                </h2>

                <motion.button
                  onClick={() => setIsModalOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-500 hover:text-red-600 transition-colors duration-200 rounded-lg p-2 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                  <svg
                    className="w-6 h-6 md:w-7 md:h-7"
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
                </motion.button>
              </div>
              <SubirDocumento projectId={projectId} onClose={closeModal} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProyectoDetalle;
