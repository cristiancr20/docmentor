// ProjectsTable.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaEye, FaPen } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { deleteProject } from "../core/Projects";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

import Swal from "sweetalert2";
import { decryptData } from "../utils/encryption";
import { errorAlert, successAlert } from "./Alerts/Alerts";

const ProjectsTable = ({
  projects,
  columns,
  linkBase,
  fetchProjects,
  onEdit,
}) => {
  const formattedProjects = Array.isArray(projects) ? projects : [projects];

  // Ordena los proyectos por la fecha de `publishedAt` (más reciente primero)

  const sortedProjects = formattedProjects.sort((a, b) => {
    // Verifica si `publishedAt` está en `attributes` o directamente en el objeto
    const dateA = a.attributes?.publishedAt
      ? new Date(a.attributes.publishedAt)
      : new Date(a.publishedAt || 0); // Si no existe, usa una fecha mínima
    const dateB = b.attributes?.publishedAt
      ? new Date(b.attributes.publishedAt)
      : new Date(b.publishedAt || 0);

    return dateB - dateA; // Orden descendente (más reciente primero)
  });

  const encryptedUserData = localStorage.getItem("userData");
  let rol = null;

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = JSON.parse(decryptData(encryptedUserData));

    // Acceder al rol desde los datos desencriptados
    rol = decryptedUserData.rol;
  } else {
    console.log("No se encontró el userData en localStorage");
  }

  const handleDelete = async (projectId) => {
    // Muestra la alerta de confirmación antes de eliminar
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
          await deleteProject(projectId);
          fetchProjects(); // Recarga los proyectos después de la eliminación
          //Swal.fire("Eliminado!", "El proyecto ha sido eliminado.", "success");
          const mensaje = "El proyecto ha sido eliminado";
          successAlert(mensaje);
        } catch (error) {
          console.error("Error al eliminar el proyecto:", error);
          Swal.fire(
            "Error!",
            "Hubo un problema al eliminar el proyecto.",
            "error"
          );

          const mensaje =
            error.response?.data?.message || "Error al eliminar el proyecto";

          errorAlert(mensaje);
        }
      }
    });
  };

  const handleEdit = async (projectId) => {
    if (onEdit) {
      onEdit(projectId);
    }
  };

  return (
    <div className="overflow-x-auto">
      <motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-gray-800"
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-2 bg-gray-800 text-center text-sm font-medium text-white uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
            {linkBase && (
              <th className="px-4 py-2 bg-gray-800 text-center text-sm font-medium text-white uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {Array.isArray(formattedProjects) && projects.length === 0 ? (
            <tr className="bg-gray-800 text-white">
              <td
                colSpan={columns.length + (linkBase ? 1 : 0)}
                className="px-4 py-4 text-center"
              >
                No hay proyectos disponibles
              </td>
            </tr>
          ) : (
            sortedProjects.map((project) => {
              // Verifica si el atributo 'revisado' existe antes de determinar el color de la fila
              const rowColor =
                project.attributes?.isRevised === false
                  ? "bg-yellow-100 border-b hover:bg-gray-300" // Pendiente
                  : project.attributes?.isRevised === true
                    ? "bg-green-100 border-b hover:bg-gray-300" // Revisado
                    : "bg-gray-50 border-b hover:bg-gray-300"; // Por defecto

              return (
                <motion.tr
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  key={project.id}
                  className={`${rowColor}`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-2 whitespace-nowrap text-base font-medium text-gray-900 text-center cursor-pointer "
                    >
                      {column.render
                        ? column.render(project)
                        : project[column.key]}
                    </td>
                  ))}
                  {linkBase && (
                    <td className="p-4 whitespace-nowrap text-base font-medium text-red-900  space-x-4 justify-center flex items-center ">
                      <Link
                        to={`${linkBase}/${project.id}`}
                        className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg"
                      >
                        <FaEye className="text-blue-600 text-lg" title="Ver" />
                      </Link>

                      {rol === "estudiante" && (
                        <>
                          <button
                            className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg"
                            onClick={() => handleEdit(project.id)}
                            title="Editar"
                          >
                            <FaPen className="text-yellow-600 text-lg" />
                          </button>

                          <button
                            className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg"
                            onClick={() => handleDelete(project.id)}
                            title="Eliminar"
                          >
                            <MdDelete className="text-red-600 text-lg" />
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </motion.tr>
              );
            })
          )}
        </tbody>
      </motion.table>
    </div>
  );
};

// Validación de props
ProjectsTable.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      attributes: PropTypes.shape({
        revisado: PropTypes.bool,
      }),
    })
  ).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func,
    })
  ).isRequired,
  linkBase: PropTypes.string,
  fetchProjects: PropTypes.func,
  onEdit: PropTypes.func,
};

export default ProjectsTable;
