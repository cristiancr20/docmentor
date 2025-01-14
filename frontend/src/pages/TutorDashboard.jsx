import React from "react";
import Navbar from "../components/Navbar";
import iconImageTutor from "../assets/tutor_icon.png";
import { motion } from "framer-motion";
import { decryptData } from "../utils/encryption";
import Header from "../components/Header";

function TutorDashboard() {
  let username = null;
  const encryptedUserData = localStorage.getItem("userData");

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = JSON.parse(decryptData(encryptedUserData));

    // Acceder al rol desde los datos desencriptados
    username = decryptedUserData.username;

  } else {
    console.log("No se encontró el userData en localStorage");
  }

  return (
    <div className="Tutor">
      <Navbar />
      <Header />
      <div className="flex items-center justify-center min-h-screen  p-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-8 lg:gap-16">
          {/* Sección de texto */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center md:text-left md:w-1/2"
          >
            <div className="mb-6">
              <span className="text-xl md:text-2xl text-indigo-600 font-semibold block mb-2">
                ¡Bienvenido, Docente {username}!
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Panel de Revisión Documental
              </h1>
            </div>

            <p className="text-lg md:text-xl text-gray-700 space-y-3">
              <span className="block mb-3">
                Este es su espacio dedicado para la revisión de los
                documentos del Proyecto de Integración Curricular de sus
                estudiantes asignados.
              </span>
              <span className="block mb-3 text-gray-600">
                Aquí podrá evaluar, retroalimentar y dar seguimiento al progreso
                de cada estudiante de manera eficiente y organizada.
              </span>
              <span className="block text-gray-600">
                Revise documentos, proporcione observaciones y mantenga una
                comunicación efectiva durante todo el proceso de titulación.
              </span>
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 1 }} // Comenzamos con escala normal
            animate={{
              scale: 1.25, // Solo animamos hasta 105%
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse", // Usamos "reverse" en lugar de "mirror"
              ease: "easeInOut", // Mantiene la transición suave
            }}
            className="relative md:w-1/2 flex justify-center z-10"
          >
            <img
              src={iconImageTutor}
              alt="Bienvenida al sistema de gestión documental"
              className="w-64 h-auto md:w-96 lg:w-[30rem] rounded-lg "
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default TutorDashboard;
