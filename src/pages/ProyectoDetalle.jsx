import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjectById, getDocumentsByProjectId } from "../core/apiCore";
import Navbar from "../components/Navbar";
import SubirDocumento from "../components/SubirDocumento";

const ProyectoDetalle = () => {
  const { projectId } = useParams(); // Obtén el ID del proyecto de la URL

  const [documents, setDocuments] = useState([]);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la visibilidad del modal

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

        <h1 className="text-3xl font-bold mb-4">{attributes.Title}</h1>
        <p className="text-lg mb-4">{attributes.Descripcion}</p>
        <p className="text-md text-gray-700 mb-6">
          Fecha de Creación:{" "}
          <span className="font-semibold">{attributes.FechaCreacion}</span>
        </p>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 border-b-2 border-gray-300 pb-2">
            Tutor:
          </h2>
          <p className="text-md text-gray-800">
            Nombre: <span className="font-medium">{tutor.username}</span>
          </p>
          <p className="text-md text-gray-800">
            Email: <span className="font-medium">{tutor.email}</span>
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 border-b-2 border-gray-300 pb-2">
            Estudiante:
          </h2>
          <p className="text-md text-gray-800">
            Nombre: <span className="font-medium">{estudiante.username}</span>
          </p>
          <p className="text-md text-gray-800">
            Email: <span className="font-medium">{estudiante.email}</span>
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 border-b-2 border-gray-300 pb-2">
            Historial de Versiones:
          </h2>

          {/* Botón para abrir el modal */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="mb-4 bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Subir Nuevo Documento
          </button>

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
                      doc.attributes.estado === false
                        ? "bg-yellow-100" // Amarillo claro para pendiente
                        : doc.attributes.estado === true
                        ? "bg-green-100" // Verde claro para revisado
                        : index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50";

                    return (
                      <tr
                        key={doc.id}
                        className={`${rowColor} ${
                          index % 2 === 0 && doc.attributes.estado === null
                            ? "bg-gray-50"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {doc.attributes.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.attributes.estado === false
                            ? "Pendiente de revisión"
                            : doc.attributes.estado === true
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
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
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
        </div>
      )}
    </div>
  );
};

export default ProyectoDetalle;
