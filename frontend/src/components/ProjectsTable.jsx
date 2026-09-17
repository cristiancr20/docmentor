import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { Eye, FolderKanban, Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { deleteProject } from "../core/Projects";
import { errorAlert, successAlert } from "./Alerts/Alerts";
import EmptyState from "./ui/EmptyState";
import { usePermission } from "../context/PermissionContext";

// Entrada corta y uniforme: sin retardo por índice, que con listas largas dejaba
// las últimas filas apareciendo segundos después.
const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

const publishedAtOf = (project) =>
  new Date(project.attributes?.publishedAt ?? project.publishedAt ?? 0);

const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line " +
  "bg-surface-2 text-muted transition-colors hover:border-line-strong hover:text-content";

const ProjectsTable = ({
  projects,
  columns,
  linkBase,
  fetchProjects,
  onEdit,
  emptyTitle = "No hay proyectos disponibles",
  emptyDescription = "Cuando existan registros aparecerán en esta tabla.",
}) => {
  const rows = Array.isArray(projects) ? projects : [projects];

  // `sort` ordena en sitio: aplicado directamente sobre el array de props mutaba
  // el estado del componente padre. Se copia antes de ordenar.
  const sortedProjects = [...rows].sort((a, b) => publishedAtOf(b) - publishedAtOf(a));

  const { hasPermission } = usePermission();

  const handleDelete = async (projectId) => {
    // SweetAlert2 pinta sus botones en línea, así que las utilidades llevan `!`
    // y `buttonsStyling` se desactiva. El botón destructivo replica la variante
    // `danger` de ui/Button, la única que usa blanco literal sobre rojo.
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      buttonsStyling: false,
      customClass: {
        popup: "!rounded-xl !border !border-line !bg-surface !shadow-pop",
        title: "!font-display !text-lg !font-semibold !text-content",
        htmlContainer: "!text-sm !text-muted",
        confirmButton:
          "!rounded-lg !bg-danger !px-4 !py-2 !text-sm !font-medium !text-white !shadow-none",
        cancelButton:
          "!ml-3 !rounded-lg !border !border-line !bg-surface-2 !px-4 !py-2 !text-sm !font-medium !text-content !shadow-none",
      },
    });

    if (!result.isConfirmed) return;

    try {
      await deleteProject(projectId);
      fetchProjects(); // Recarga los proyectos después de la eliminación
      successAlert("El proyecto ha sido eliminado");
    } catch (error) {
      console.error("Error al eliminar el proyecto:", error);
      errorAlert(error.response?.data?.message || "Error al eliminar el proyecto");
    }
  };

  const handleEdit = (projectId) => {
    if (onEdit) onEdit(projectId);
  };

  if (sortedProjects.length === 0) {
    return (
      <EmptyState icon={FolderKanban} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="overflow-x-auto">
      <motion.table {...fadeIn} className="w-full min-w-full text-sm">
        <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left font-medium">
                {column.label}
              </th>
            ))}
            {linkBase && <th className="px-4 py-3 text-left font-medium">Acciones</th>}
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {sortedProjects.map((project) => (
            <tr key={project.id} className="transition-colors hover:bg-surface-2">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-top text-content">
                  {column.render ? column.render(project) : project[column.key]}
                </td>
              ))}

              {linkBase && (
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <Link to={`${linkBase}/${project.id}`} className={iconButtonClass} title="Ver">
                      <Eye className="h-4 w-4" strokeWidth={1.8} />
                    </Link>

                    {hasPermission("UPDATE_PROJECT") && (
                      <button
                        type="button"
                        className={iconButtonClass}
                        onClick={() => handleEdit(project.id)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    )}

                    {hasPermission("DELETE_PROJECT") && (
                      <button
                        type="button"
                        className={`${iconButtonClass} hover:text-danger`}
                        onClick={() => handleDelete(project.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
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
        // El campo real del backend es `isRevised`; el propType declaraba
        // `revisado`, que no existe en ninguna respuesta.
        isRevised: PropTypes.bool,
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
  emptyTitle: PropTypes.node,
  emptyDescription: PropTypes.node,
};

export default ProjectsTable;
