import React from "react";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import iconImage from "../assets/icon_document.png";
import Header from "../components/Header";

function StudentDashboard() {
  return (
    <div className="Students">
      <Navbar />
      <div>
        <Header />
        <div className="flex items-center justify-center min-h-screen content-center ">
          <div className="container mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-8 lg:gap-16">
            {/* Sección de texto */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center md:text-left md:w-1/2"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                ¡Impulsa tu Proyecto de Integración Curricular!
              </h1>
              <p className="text-lg md:text-xl text-gray-700 space-y-2">
                <span className="block mb-3">
                  Bienvenido al espacio donde podrás gestionar y dar seguimiento
                  a toda la documentación de tu Proyecto de Integración
                  Curricular de manera organizada y eficiente.
                </span>
                <span className="block text-gray-600">
                  Sube documentos, realiza seguimiento de revisiones y mantén
                  todo tu proceso documentado en un solo lugar.
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
              className="md:w-1/2 flex justify-center"
            >
              <img
                src={iconImage}
                alt="Bienvenida al sistema de gestión documental"
                className="w-64 h-auto md:w-96 lg:w-[30rem] rounded-lg"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
