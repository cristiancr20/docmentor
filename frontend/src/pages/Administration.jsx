import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { motion } from "framer-motion";
import { getEmail, saveEmail, updateEmail } from "../core/Setting";
import { errorAlert, successAlert } from "../components/Alerts/Alerts";

function Administration() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailsSMTP, setEmailsSMTP] = useState([]);

  useEffect(() => {
    fetchsEmails();
  }, []);

  /* Listar emails */
  const fetchsEmails = async () => {
    try {
      const response = await getEmail();
      setEmailsSMTP(response.data);
    } catch (error) {
      console.error("Error al obtener el email:", error);
    }
  };

  /* CAMBIAR EMAILS EN USO */
  const handleSetActual = async (emailId) => {
    try {
      await updateEmail(emailId);
  
      // Actualizar el estado localmente sin reorganizar la tabla
      setEmailsSMTP((prevEmails) =>
        prevEmails.map((email) => ({
          ...email,
          attributes: {
            ...email.attributes,
            isActual: email.id === emailId, // Solo el email seleccionado será true
          },
        }))
      );
  
      successAlert("Email actualizado correctamente");
    } catch (error) {
      console.error(
        "Error al actualizar el email:",
        error.response ? error.response.data : error.message
      );
      errorAlert();
    }
  };
  

  /* Guardar emails */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const email_notifications = {
      email_notifications: email,
    };

    try {
      await saveEmail(email_notifications);
      successAlert("Email creado correctamente");
      setEmail("");
      fetchsEmails(); // Recargar la lista después de guardar
    } catch (error) {
      console.error(
        "Error al crear el email:",
        error.response ? error.response.data : error.message
      );
      errorAlert();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <Header />
      <div className="container mx-auto px-4 mt-10 mb-10 flex flex-col lg:flex-row gap-8 justify-center items-start">
        {/* Formulario */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-full lg:w-1/3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Configuración de Correo
          </h2>
          <label className="block mb-4">
            <span className="text-gray-300">Correo de notificación:</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-700 rounded bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
            />
          </label>
          <motion.button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? "Guardando..." : "Guardar Correo"}
          </motion.button>
        </motion.div>

        {/* Tabla */}
        <div className="w-full lg:w-2/3 overflow-x-auto">
          <motion.table
            className="min-w-full bg-gray-900 text-white border border-gray-700 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <thead>
              <tr className="bg-gray-700">
                <th className="py-2 px-4 border-b">Correo Electrónico</th>
                <th className="py-2 px-4 border-b">Estado</th>
                <th className="py-2 px-4 border-b">Acción</th>
              </tr>
            </thead>
            <motion.tbody>
              {emailsSMTP.length > 0 ? (
                emailsSMTP.map((email, index) => (
                  <motion.tr
                    key={email.id}
                    className="border-b border-gray-700 hover:bg-gray-800 transition-all"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <td className="py-2 px-4 text-center">
                      {email.attributes.email_notifications}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {email.attributes.isActual ? (
                        <span className="text-green-400 font-semibold">
                          En uso
                        </span>
                      ) : (
                        <span className="text-gray-400">No en uso</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {!email.attributes.isActual && (
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                          onClick={() => handleSetActual(email.id)}
                        >
                          Volver Actual
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400">
                    No hay correos registrados.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </motion.table>
        </div>
      </div>
    </div>
  );
}

export default Administration;
