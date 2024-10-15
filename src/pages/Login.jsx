import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, getUserWithRole } from "../core/Autentication";
import { loginSuccessAlert, loginErrorAlert } from "../components/Alerts/Alerts";

import { motion } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Autenticación del usuario
      const authResponse = await login({
        identifier: email,
        password: password,
      });

      if (authResponse && authResponse.jwt) {
        const { jwt, user } = authResponse;

        // Guardamos el token JWT en el localStorage
        localStorage.setItem("jwtToken", jwt);

        const userWithRole = await getUserWithRole(user.id);

        // Ahora puedes redirigir según el rol del usuario
        const userRole = userWithRole.rol?.tipoRol;
        const username = user.username;
        const useremail = user.email;
        const userId = user.id;

        localStorage.setItem("rol", userRole);
        localStorage.setItem("username", username);
        localStorage.setItem("email", useremail);
        localStorage.setItem("userId", userId);

        loginSuccessAlert(username);
        if (userRole === "tutor") {
          navigate("/tutor/dashboard");
        } else if (userRole === "estudiante") {
          navigate("/student/dashboard");
        } else {
          console.error("Rol desconocido");
        }
      } else {
        loginErrorAlert("No se recibió respuesta válida del servidor.");
      }

    } catch (error) {
      // Capturamos más detalles del error
      console.error("Error en login:", error);
      loginErrorAlert("Error en el inicio de sesión. Verifica tus credenciales.");
    }
  };

  return (
    <div className="bg-cover bg-center bg-no-repeat bg-blend-multiply  min-h-screen bg-gray-900  bg-[url('https://i.pinimg.com/736x/d9/31/5e/d9315e4c788771c8cba5406db9791d75.jpg')] ">
      <div className="px-4 mx-auto max-w-screen-xl py-24 lg:py-56 ">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          class="max-w-sm mx-auto bg-gray-900 p-4 rounded-lg"
          onSubmit={handleSubmit}
        >
          <div class="mb-5">
            <label
              for="email"
              class="block mb-2 text-sm font-medium  text-white"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              class="bg-gray-50 border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="nombre@unl.edu.ec"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div class="mb-5">
            <label
              for="password"
              class="block mb-2 text-sm font-medium  text-white"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              class="bg-gray-50 border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Iniciar Sesión
          </button>
          <div className="m-2 text-white">
            No tienes cuenta?{" "}
            <span className="text-blue-700">
              <Link to="/signup">REGISTRATE</Link>
            </span>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default Login;
