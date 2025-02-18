import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginSuccessAlert,
  loginErrorAlert,
} from "../components/Alerts/Alerts";
import { motion } from "framer-motion";
import { getPrimaryRole, ROLE_ROUTES } from "../utils/auth.utils";
import { useAuth } from "../context/AuthContext";
import { syncUserWithStrapi } from "../core/Autentication";

const LoginInstitucional = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { loginInstitutional } = useAuth();

  const handleAerobaseLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Obtener datos del usuario
      const userData = await loginInstitutional(email, password);

      console.log("🔑 Datos del usuario:", userData);

      // Sincronizar con Strapi
      await handleVerifyUser(userData.token);

      // Mostrar alerta de éxito
      loginSuccessAlert(userData.name);

      // Procesar roles y redirigir
      const userRoles = Array.isArray(userData.rols)
        ? userData.rols
        : [userData.rols];

      console.log("🔑 Roles del usuario:", userRoles);

      const priorityRole = userRoles.includes("superadmin")
        ? "superadmin"
        : userRoles.includes("tutor")
          ? "tutor"
          : "estudiante";

      console.log("🔑 Rol prioritario:", priorityRole);

      setTimeout(() => {
        navigate(ROLE_ROUTES[priorityRole], { replace: true });
      }, 500);

      // Forzar la redirección
      navigate(ROLE_ROUTES[priorityRole], { replace: true });
    } catch (error) {
      console.error("Error en login de Aerobase:", error);
      loginErrorAlert(
        error.message || "Error en el inicio de sesión institucional"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyUser = async (token) => {
    try {
      const user = await syncUserWithStrapi(token);
      return user;
    } catch (err) {
      console.error("Error:", err);
      throw err; // Propagar el error
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-900 bg-cover bg-center bg-no-repeat bg-blend-multiply"
      style={{
        backgroundImage:
          "url('https://i.pinimg.com/736x/d9/31/5e/d9315e4c788771c8cba5406db9791d75.jpg')",
      }}
    >
      <div className="flex items-center justify-center px-4 py-24 mx-auto max-w-screen-md lg:py-56">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md"
        >
          <h2 className="text-white text-2xl font-bold text-center mb-6">
            Login Institucional
          </h2>

          <form onSubmit={handleAerobaseLogin}>
            <div className="mb-4">
              <label className="block text-white text-sm mb-2">
                Email Institucional
              </label>
              <input
                type="email"
                className="w-full p-2.5 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="nombre@unl.edu.ec"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-white text-sm mb-2">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full p-2.5 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="********"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting
                ? "Iniciando sesión..."
                : "Iniciar Sesión Institucional"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-blue-500 hover:underline"
            >
              Volver a la pagina principal principal
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginInstitucional;
