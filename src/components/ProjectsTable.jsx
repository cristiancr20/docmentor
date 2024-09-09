// ProjectsTable.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaEye, FaPen } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { deleteProject } from "../core/Projects";

import Swal from "sweetalert2";

const ProjectsTable = ({ projects, columns, linkBase, onDelete: fetchProjects, onEdit }) => {
  const rol = localStorage.getItem("rol");

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
          Swal.fire("Eliminado!", "El proyecto ha sido eliminado.", "success");
        } catch (error) {
          console.error("Error al eliminar el proyecto:", error);
          Swal.fire(
            "Error!",
            "Hubo un problema al eliminar el proyecto.",
            "error"
          );
        }
      }
    });
  };


  const handleEdit = async (projectId) => {
    if(onEdit){
      onEdit(projectId);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-gray-800">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-2 bg-gray-800 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
            {linkBase && (
              <th className="px-4 py-2 bg-gray-800 text-left text-xs font-medium text-white uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr className="bg-gray-800 text-white">
              <td
                colSpan={columns.length + (linkBase ? 1 : 0)}
                className="px-4 py-4 text-center"
              >
                No hay proyectos disponibles
              </td>
            </tr>
          ) : (
            projects.map((project) => (
              <tr key={project.id} className="bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900"
                  >
                    {column.render
                      ? column.render(project)
                      : project[column.key]}
                  </td>
                ))}
                {linkBase && (
                  <td className="p-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center space-x-4">
                  <Link to={`${linkBase}/${project.id}`} className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg">
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
                <td></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTable;
