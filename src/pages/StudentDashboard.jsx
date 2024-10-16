import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import {motion} from 'framer-motion';

function StudentDashboard () {
  return (
    <div className="Students">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ¡Bienvenido al Sistema de Gestión Documental!
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Como estudiante, aquí podrás gestionar tus documentos, acceder a materiales y más.
        </p>
        
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        className="mt-8"
      >
        
      </motion.div>
    </div>
    </div>
  );
}

export default StudentDashboard ;
