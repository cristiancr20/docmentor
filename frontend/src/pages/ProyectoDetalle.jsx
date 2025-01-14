import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDocumentsByProjectId } from "../core/Document";
import { getProjectById } from "../core/Projects";
import Navbar from "../components/Navbar";
import SubirDocumento from "../components/SubirDocumento";
import { motion, AnimatePresence } from "framer-motion";
import { User, Users } from "lucide-react";
import { warningAlert } from "../components/Alerts/Alerts";
import GeneratePdfButton from "../components/GeneratePdfButton";

import DocumentComparePopup from "../components/DocumentComparePopup";
import { decryptData } from "../utils/encryption";
import ProjectsTable from "../components/ProjectsTable";
import Header from "../components/Header";
import { IoArrowBack } from "react-icons/io5";

const ProyectoDetalle = () => {
  const { projectId } = useParams(); // Obtén el ID del proyecto de la URL

  const [documents, setDocuments] = useState([]);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la visibilidad del modal
  let rol = null;
  const [isShowComparePopupOpen, setShowIsComparePopupOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(documents.length - 2);

  const encryptedUserData = localStorage.getItem("userData");

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = JSON.parse(decryptData(encryptedUserData));

    // Acceder al rol desde los datos desencriptados
    rol = decryptedUserData.rol;
  } else {
    console.log("No se encontró el userData en localStorage");
  }

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
      setError("Error fetching project details");
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

  /*   const closeComparePopup = () => {
    setShowIsComparePopupOpen(false);
  }; */

  if (!project) {
    return <p>Cargando detalles del proyecto...</p>;
  }

  const { attributes } = project;
  const tutor = attributes.tutor?.data?.attributes || {};
  // Acceder a los estudiantes (iterar sobre el array)
  const estudiantes =
    attributes.students?.data?.map((estudiante) => {
      return estudiante.attributes;
    }) || [];

  const itinerario = attributes.itinerary || {};
  const tipoProyecto = attributes.projectType || {};

  const closeModal = () => {
    setIsModalOpen(false);
    // Opcionalmente, podrías volver a cargar los documentos aquí si es necesario
    fetchProject();
  };

  const columns = [
    {
      key: "title",
      label: "Documento",
      render: (doc) => doc.attributes.title,
    },
    {
      key: "isRevised",
      label: "Estado",
      render: (doc) =>
        doc.attributes.isRevised === false
          ? "Pendiente de revisión"
          : doc.attributes.isRevised === true
            ? "Revisado"
            : "Sin estado",
    },
    {
      key: "publishedAt",
      label: "Fecha de Subida",
      render: (doc) => {
        const date = new Date(doc.attributes.publishedAt);
        // Convierte la fecha al formato local
        return date.toLocaleString("es-ES", {
          weekday: "long", // Día de la semana
          year: "numeric", // Año completo
          month: "long", // Mes completo
          day: "numeric", // Día del mes
          hour: "2-digit", // Hora en formato de 2 dígitos
          minute: "2-digit", // Minutos
          second: "2-digit", // Segundos
          hour12: false, // Usa el formato de 24 horas
        });
      },
    },
    {
      key: "acciones",
      label: "",
      render: (doc) =>
        doc.attributes.documentFile?.data?.length > 0 &&
        doc.attributes.documentFile.data[0]?.attributes?.url ? (
          <a
            href={`/document/${doc.id}`}
            className="text-blue-600 hover:underline"
          >
            Ver Documento
          </a>
        ) : (
          <span className="text-gray-500">No hay documento</span>
        ),
    },
  ];

  return (
    <div>
      <Navbar />
      <Header />
      <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 rounded-lg shadow-md">
          {/* Sección de información del proyecto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center border-b pb-4 mb-4">
              <div className="flex items-center space-x-3 m-2">
                {rol === "estudiante" && (
                  <Link
                    to="/student/projects/view"
                    className="flex items-center bg-indigo-600 text-white rounded-lg py-2 px-4 hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <IoArrowBack className="text-white text-xl mr-2" />
                    <span className="text-lg font-bold">Volver a los proyectos</span>
                  </Link>
                )}

                {rol === "tutor" && (
                  <Link
                    to="/tutor/assigned-projects"
                    className="flex items-center bg-indigo-600 text-white rounded-lg py-2 px-4 hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <IoArrowBack className="text-white text-xl mr-2" />
                    <span className="text-lg font-bold">Volver a los proyectos</span>
                  </Link>
                )}
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: project ? 1 : 0.5, y: 0 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center text-4xl font-bold text-gray-900 text-center"
              >
                {project ? attributes.title : "Cargando..."}
              </motion.h1>
            </div>

            <h2 className="text-2xl font-bold ">Descripción del Proyecto:</h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-lg mb-4 text-gray-700 leading-relaxed"
            >
              {attributes.description}
            </motion.p>

            <div className="flex items-center ">
              <h2 className="text-1xl font-bold mr-4">
                Creación del Proyecto:
              </h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center p-2  md:rounded-md rounded-lg bg-blue-50 text-blue-700"
              >
                <span className="text-xs md:text-base">
                  {new Date(attributes.publishedAt).toLocaleDateString(
                    "es-ES",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    }
                  )}
                </span>
              </motion.div>
            </div>
            {/* Itinerario */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-2 text-1xl mt-2"
            >
              <h3 className="font-bold text-gray-800">Itinerario:</h3>
              <p className="px-3 py-1 md:rounded-md rounded-lg bg-blue-50 text-blue-700 text-xs md:text-base ">
                {itinerario || "Itinerario no especificado"}
              </p>
            </motion.div>
          </motion.div>

          <div>
            {/* Sección del tutor o estudiante */}
            {rol === "estudiante" && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="lg:w-80 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 border border-blue-100"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gray-900 text-white rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-md">
                      <User className="w-12 h-12" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-gray-800">
                        Tutor del Proyecto
                      </h2>
                      <p className="text-lg font-semibold text-blue-600 ">
                        {tutor.username}
                      </p>
                      <div className="flex flex-col items-center text-center">
                        <div className="flex items-center m-1">
                          <p className="inline-flex items-center px-4 py-2  md:rounded-md rounded-lg  bg-blue-50 text-blue-700">
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
                    {/* Icono condicional según el tipo de proyecto */}
                    <div className="bg-gray-900 text-white rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-md">
                      {tipoProyecto === "Grupal" ? (
                        <Users className="w-12 h-12" /> // Ícono para grupo
                      ) : (
                        <User className="w-12 h-12" /> // Ícono para individual
                      )}
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-lg font-bold text-gray-800">
                        Estudiantes
                      </h2>

                      <div className="grid gap-4">
                        {estudiantes.map((estudiante, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="flex items-center space-x-4 p-3 bg-white shadow-sm rounded-lg border border-gray-100 hover:border-blue-200 transition-colors duration-200 cursor-pointer">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-blue-700 truncate">
                                  {estudiante.username ||
                                    "Nombre no disponible"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {estudiante.email || "Correo no disponible"}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
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
            <>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onClick={() => setIsModalOpen(true)}
                className="font-bold mb-4 bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Subir Nuevo Documento
              </motion.button>
            </>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onClick={handleCompareClick}
            className="font-bold mb-4 ml-4 bg-red-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700"
          >
            Comparar Versiones
          </motion.button>

          {rol === "tutor" && <GeneratePdfButton userInfo={attributes} />}

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

          <ProjectsTable projects={documents} columns={columns} />
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
