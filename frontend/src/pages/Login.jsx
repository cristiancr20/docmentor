import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserWithRole, login as loginServer } from "../core/Autentication";
import {
  loginSuccessAlert,
  loginErrorAlert,
} from "../components/Alerts/Alerts";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { ROLE_ROUTES, validateAuthResponse } from "../utils/auth.utils";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Intento de login o registro
      const authResponse = await loginServer({
        identifier: email,
        password: password,
      });

      // Validar la respuesta
      validateAuthResponse(authResponse);

      // Extraer datos y guardar JWT
      const { jwt, user } = authResponse;

      console.log("🔑 Usuario :", user.id)

      // Obtener rol del usuario
      const userWithRole = await getUserWithRole(user.id);
      console.log("🔑 Usuario con rol:", userWithRole);
      const userRole = userWithRole.rols?.[0]?.rolType;
      console.log("🔑 Rol del usuario:", userRole);

      if (!userRole) {
        throw new Error("No se pudo obtener el rol del usuario");
      }


      // Crear el objeto con los datos completos del usuario
      const userData = {
        ...user,
        rol: userRole,
        isInstutional:false
      };

      // 3. Llamar al método `login` del contexto
      login(userData, jwt); // Encripta y guarda los datos globalmente

      // 4. Mostrar mensaje de éxito
      loginSuccessAlert(user.username);

      // 5. Redirigir según el rol
      const route = ROLE_ROUTES[userRole];
      if (route) {
        navigate(route);
      } else {
        throw new Error(`Rol desconocido: ${userRole}`);
      }
    } catch (error) {
      console.error("Error en el proceso de autenticación:", error);
      loginErrorAlert("Error en el inicio de sesión. Verifica tus credenciales.");
    } finally {
      setIsSubmitting(false);
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
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md"
          onSubmit={handleSubmit}
        >
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-white"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-2.5 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-white placeholder-gray-400"
              placeholder="nombre@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-5">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-white"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full p-2.5 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-white placeholder-gray-400 pr-10"
                placeholder="********"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 text-lg ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
          <div className="mt-4 text-center text-white">
            ¿No tienes cuenta?{" "}
            <Link to="/sign-up" className="text-blue-500 hover:underline">
              Regístrate
            </Link>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-blue-500 hover:underline"
            >
              Volver a la pagina principal principal
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default Login;