import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, getUserWithRole } from "../core/Autentication";
import {
  loginSuccessAlert,
  loginErrorAlert,
} from "../components/Alerts/Alerts";
import { motion } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const authResponse = await login({
        identifier: email,
        password: password,
      });

      if (authResponse && authResponse.jwt) {
        const { jwt, user } = authResponse;
        localStorage.setItem("jwtToken", jwt);

        const userWithRole = await getUserWithRole(user.id);
        const userRole = userWithRole.rol?.tipoRol;
        const username = user.username;

        // Almacenar datos no sensibles en `sessionStorage` si es necesario
        /* sessionStorage.setItem("username", username);
        sessionStorage.setItem("userRole", userRole); */
        localStorage.setItem("rol", userRole);
        localStorage.setItem("username", username);
        localStorage.setItem("email", user.email);
        localStorage.setItem("userId", user.id);

        if (userRole === "tutor") {
          navigate("/tutor/dashboard");
          loginSuccessAlert(username);
        } else if (userRole === "estudiante") {
          navigate("/student/dashboard");
        } else {
          console.error("Rol desconocido");
        }
      } else {
        loginErrorAlert("No se recibió respuesta válida del servidor.");
      }
    } catch (error) {
      console.error("Error en login:", error);
      loginErrorAlert(
        "Error en el inicio de sesión. Verifica tus credenciales."
      );
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
              placeholder="nombre@unl.edu.ec"
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
            <input
              type="password"
              id="password"
              className="w-full p-2.5 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-white placeholder-gray-400"
              placeholder="********"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg sm:w-auto hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Iniciar Sesión
          </button>
          <div className="mt-4 text-center text-white">
            ¿No tienes cuenta?{" "}
            <Link to="/signup" className="text-blue-500 hover:underline">
              Regístrate
            </Link>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default Login;
