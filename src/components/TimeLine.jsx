import React from 'react';
import { motion } from 'framer-motion';

const Timeline = ({ versions }) => {
  // Ordenar versiones por fecha de creación, la más reciente primero
  const sortedVersions = [...versions].sort((a, b) => new Date(b.attributes.createdAt) - new Date(a.attributes.createdAt));

  return (
    <div className="w-full md:w-3/4 mx-auto p-4">
      <div className="relative">
        {/* Línea central del timeline */}
        <div className="absolute inset-0 left-1/2 border-l border-gray-300 dark:border-gray-700"></div>
        
        <ol className="relative">
          {sortedVersions.map((version, index) => (
            <motion.li
              key={version.id}
              className={`mb-10 flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              {/* Punto en el timeline */}
              <div className={`relative bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-lg p-6 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 ${index % 2 === 0 ? 'ml-6' : 'mr-6'}`}>
                <time className="mb-1 text-sm font-normal leading-none text-gray-600 dark:text-gray-400">
                  {new Date(version.attributes.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {version.attributes.title}
                </h3>
                <p className="text-base font-normal text-gray-700 dark:text-gray-300">
                  {version.attributes.description || 'No hay descripción disponible.'}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default Timeline;
