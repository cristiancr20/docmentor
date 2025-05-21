import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRoles, registerUser } from "../core/Autentication";
import { successAlert, registerErrorAlert } from "../components/Alerts/Alerts";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rols, setRols] = useState("");
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    try {
      const data = { username, email, password, rols , isInstitutional: false};
      await registerUser(data);
      successAlert();

      setUsername("");
      setEmail("");
      setPassword("");
      setRols("");
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-cover bg-center bg-no-repeat bg-gray-900 bg-blend-multiply h-screen flex flex-col bg-[url('https://i.pinimg.com/736x/d9/31/5e/d9315e4c788771c8cba5406db9791d75.jpg')]">
      <div className="flex-grow flex flex-col justify-center items-center px-4 py-8">
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

          <div className="mb-5">
            <label
              htmlFor="rol"
              className="block mb-2 text-sm font-medium text-white"
            >
              Rol
            </label>
            <select
              id="rols"
              className="w-full p-2.5 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-white placeholder-gray-400"
              required
              value={rols}
              onChange={(e) => setRols(e.target.value)}
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
            disabled={isSubmitting}
            className={`w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 text-lg ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "Registrando..." : "Registrarme"}
          </button>
          <div className="mt-4 text-center text-white">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Inicia Sesión
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
}

export default SignUp;
