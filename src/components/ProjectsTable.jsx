import React from 'react';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';

const ProjectsTable = ({ projects, columns, linkBase }) => {
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
            {/* 
            {linkBase && (
              <th className="px-4 py-2 bg-gray-800 text-left text-xs font-medium text-white uppercase tracking-wider">
                Acciones
              </th>
            )} */}
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr className="bg-gray-800 text-white">
              <td colSpan={columns.length + (linkBase ? 1 : 0)} className="px-4 py-4 text-center">
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
                    {column.render ? column.render(project) : project[column.key]}
                  </td>
                ))}
                {linkBase && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link to={`${linkBase}/${project.id}`}>
                      <FaEye className="text-blue-600 hover:underline" />
                    </Link>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTable;
