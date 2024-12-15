import React from "react";
import LogoCarrera from "../assets/logo_carrera.png";
import LogoUniversidad from "../assets/logo_universidad.png";
import { motion } from "framer-motion";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="py-4 border-b-4 border-gray-900"
    >
      <nav className="container mx-auto flex items-center justify-around">
        {/* Logo de la carrera */}
        <img
          src={LogoCarrera}
          alt="Logo de Computación"
          className="md:w-60 w-40"
        />

        {/* Logo de la universidad */}
        <img
          src={LogoUniversidad}
          alt="Logo de Universidad Nacional de Loja"
          className="md:w-60 w-40"
        />
      </nav>
    </motion.header>
  );
};

export default Header;
