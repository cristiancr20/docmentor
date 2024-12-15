import React from "react";
import { useNavigate } from "react-router-dom";
import {motion} from "framer-motion";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-cover bg-center bg-no-repeat bg-gray-800 bg-blend-multiply  min-h-screen  bg-[url('https://i.pinimg.com/736x/d9/31/5e/d9315e4c788771c8cba5406db9791d75.jpg')]  ">
      <div className="container mx-auto py-16 container mx-auto py-8 w-4/5 ">
        <div className="px-4 mx-auto max-w-screen-xl text-center py-24 lg:py-56 ">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5, // Duración de la animación en segundos
              ease: "easeInOut", // Tipo de suavizado
            }}
          className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
            Bienvenido a DocMentor
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5, // Duración de la animación en segundos
              ease: "easeInOut", // Tipo de suavizado
            }}

          className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-400">
            DocMentor es el sistema de versionado documental que transforma la
            forma en que gestionas tus documentos. Con un enfoque en la
            colaboración entre estudiantes y tutores, DocMentor te permite
            rastrear, revisar y mejorar documentos de manera eficiente. Mantén
            un historial completo de versiones, accede a comentarios detallados
            y sube nuevas versiones sin perder nunca de vista el progreso de tu
            proyecto. Simplifica la gestión documental y maximiza tu
            productividad con DocMentor
          </motion.p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0">
            <motion.button

              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5, // Duración de la animación en segundos
                ease: "easeInOut", // Tipo de suavizado
              }}
              onClick={() => navigate("/login")}
              className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              Iniciar Sesión
              <svg
                className="w-3.5 h-3.5 ml-2 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5h12m0 0L9 1m4 4L9 9"
                />
              </svg>
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5, // Duración de la animación en segundos
                ease: "easeInOut", // Tipo de suavizado
              }}
              onClick={() => navigate("/sign-up")}
              className="py-3 px-5 sm:ml-4 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            >
              Registrarse
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
