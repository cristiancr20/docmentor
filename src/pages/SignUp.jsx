import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getRoles, registerUser } from "../core/Autentication";
import { successAlert, errorAlert } from "../components/Alerts/Alerts";
import {motion} from 'framer-motion';

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState();

  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        setRoles(response.data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      username,
      email,
      password,
      rol,
    };
    
    try {
      const response = await registerUser(data);
      successAlert();
      setUsername("");
      setEmail("");
      setPassword("");
      setRol("");
      window.location.href = "/login";
    } catch (error) {
      console.error("Error registering user:", error);
      errorAlert();
    }
  };

  return (
    <div className="bg-cover bg-center bg-no-repeat bg-gray-900 bg-blend-multiply  min-h-screen bg-[url('https://i.pinimg.com/736x/d9/31/5e/d9315e4c788771c8cba5406db9791d75.jpg')]  ">
      <div className="px-4 mx-auto max-w-screen-xl py-24 lg:py-56 ">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate ={{ opacity: 1, y: 0 }}
          transition ={{ duration: 0.5 }}
          class="max-w-sm mx-auto bg-gray-900 p-4 rounded-lg"
          onSubmit={handleSubmit}
        >
          <div class="mb-5">
            <label
              for="username"
              class="block mb-2 text-sm font-medium  text-white"
            >
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              class="bg-gray-50 border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="nombre de usuario"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

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

          <div class="mb-5">
            <label for="rol" class="block mb-2 text-sm font-medium  text-white">
              Rol
            </label>
            <select
              class="text-white bg-gray-50 border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              <option>Seleccione una opción</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.attributes.tipoRol}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Registrarme
          </button>
          <div className="m-2 text-white">
            Ya tienes una cuenta?{" "}
            <span className="text-blue-700">
              <Link to="/login">INICIA SESIÓN</Link>
            </span>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

export default SignUp;
