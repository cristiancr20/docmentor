import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRoles, registerUser } from "../core/Autentication";
import { successAlert, registerErrorAlert } from "../components/Alerts/Alerts";
import { motion } from "framer-motion";

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("");
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
  }, []);
  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      // Accede a la propiedad 'data' para obtener los roles
      if (response && response.data) {
        setRoles(response.data); // Aquí asignas directamente los roles a setRoles
      } else {
        console.error(
          "Error: La respuesta no contiene los roles correctamente."
        );
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = { username, email, password, rol };
      await registerUser(data);
      successAlert();

      setUsername("");
      setEmail("");
      setPassword("");
      setRol("");
      navigate("/login");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 409) {
          registerErrorAlert("El usuario ya existe.");
        } else if (error.response.status === 400) {
          registerErrorAlert("Error en los datos proporcionados.");
        } else {
          registerErrorAlert(
            "Error al registrar el usuario. Inténtalo de nuevo."
          );
        }
      } else {
        registerErrorAlert(
          "Error al registrar el usuario. Inténtalo de nuevo."
        );
      }
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
              htmlFor="username"
              className="block mb-2 text-sm font-medium text-white"
            >
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              className="w-full p-2.5 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-white placeholder-gray-400"
              placeholder="nombre de usuario"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

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

          <div className="mb-5">
            <label
              htmlFor="rol"
              className="block mb-2 text-sm font-medium text-white"
            >
              Rol
            </label>
            <select
              id="rol"
              className="w-full p-2.5 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-white placeholder-gray-400"
              required
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              <option value="">Seleccione una opción</option>
              {roles && roles.length > 0 ? (
                roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.attributes.rolType}
                  </option>
                ))
              ) : (
                <option disabled>Cargando roles...</option>
              )}
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg sm:w-auto hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Registrarme
          </button>
          <div className="mt-4 text-center text-white">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Inicia Sesión
            </Link>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

export default SignUp;
