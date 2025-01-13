import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  createProject,
  getTutors,
  getUserByEmail,
  getUserById,
} from "../core/Projects";
import { successAlert, errorAlert } from "./Alerts/Alerts";
import { motion } from "framer-motion";
import { decryptData } from "../utils/encryption";
import { User } from "lucide-react";

const NewProject = ({ onClose, fetchProjects }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tutores, setTutores] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState("");
  const [projectType, setProjectType] = useState("Individual");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerData, setPartnerData] = useState(null);
  const [selectedItinerary, setSelectedItinerary] = useState("");
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const encryptedUserData = localStorage.getItem("userData");
  let userId = null;

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = decryptData(encryptedUserData);

    // Acceder al rol desde los datos desencriptados
    userId = decryptedUserData.id;
  } else {
    console.log("No se encontró el userData en localStorage");
  }

  useEffect(() => {
    const obtenerTutors = async () => {
      try {
        const response = await getTutors();
        setTutores(response);
      } catch (error) {
        console.error("Error al obtener los tutores:", error);
      }
    };
    obtenerTutors();
  }, []);

  // Función para obtener el id del compañero por correo electrónico
  const getPartnerIdByEmail = async (email) => {
    try {
      const response = await getUserByEmail(email);

      if (response && Array.isArray(response) && response.length > 0) {
        return response[0].id;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error al obtener el ID del usuario:", error);
      return null;
    }
  };

  // Manejar el cambio en el correo del compañero
  const handlePartnerEmailChange = async (e) => {
    const email = e.target.value;
    setPartnerEmail(email);

    // Buscar el compañero por el correo ingresado
    const getPartnerId = await getPartnerIdByEmail(email);

    if (getPartnerId) {
      try {
        const response = await getUserById(getPartnerId);
        if (response) {
          const partner = response;
          setPartnerData(partner);
        } else {
          console.error("No se encontró la información del compañero.");
          setPartnerData(null);
        }
      } catch (error) {
        console.error("Error al obtener los datos del compañero:", error);
        setPartnerData(null);
      }
    } else {
      setPartnerData(null);
    }
  };

  const handleAddPartner = () => {
    if (
      partnerData &&
      !selectedPartners.some((partner) => partner.id === partnerData.id)
    ) {
      setSelectedPartners((prev) => [...prev, partnerData]);
      setPartnerEmail(""); // Limpia el campo de entrada
      setPartnerData(null); // Reinicia los datos del compañero
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    const validEstudiantes = [
      userId,
      ...selectedPartners.map((partner) => partner.id),
    ].filter((id) => id != null);

    const projectData = {
      title: title,
      description: description,
      tutor: parseInt(selectedTutor, 10),
      students: validEstudiantes,
      projectType: projectType,
      itinerary: selectedItinerary,
    };

    const mensaje = "Proyecto creado exitosamente";
    try {
      await createProject(projectData);
      successAlert(mensaje);
      fetchProjects();
      onClose();
      setTitle("");
      setDescription("");
      setPartnerEmail("");
      setSelectedTutor("");
    } catch (error) {
      console.error(
        "Error al crear el proyecto:",
        error.response ? error.response.data : error.message
      );
      errorAlert();
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="md:p-8 bg-gray-50"
    >
      <motion.form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-6 md:p-8"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label
              htmlFor="title"
              className="block text-gray-700 font-semibold mb-2 text-lg"
            >
              Título del Proyecto
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Ingrese el título de su proyecto"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label
              htmlFor="description"
              className="block text-gray-700 font-semibold mb-2 text-lg"
            >
              Descripción del Proyecto
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-h-[120px] resize-y"
              placeholder="Describa brevemente su proyecto"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label
              htmlFor="projectType"
              className="block text-gray-700 font-semibold mb-2 text-lg"
            >
              Tipo de Proyecto
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  name="projectType"
                  value="Individual"
                  checked={projectType === "Individual"}
                  onChange={(e) => setProjectType(e.target.value)}
                />
                <span className="ml-2">Individual</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  name="projectType"
                  value="Grupal"
                  checked={projectType === "Grupal"}
                  onChange={(e) => setProjectType(e.target.value)}
                />
                <span className="ml-2">En Pareja</span>
              </label>
            </div>
          </motion.div>

          {projectType === "Grupal" && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label
                htmlFor="partnerEmail"
                className="block text-gray-700 font-semibold mb-2 text-lg"
              >
                Correo del Compañero
              </label>
              <input
                type="email"
                id="partnerEmail"
                value={partnerEmail}
                onChange={handlePartnerEmailChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Ingrese el correo de su compañero"
              />

              {partnerData ? (
                <motion.div
                  className=" flex items-center justify-between mt-4 p-4 border rounded-lg bg-green-50 shadow-lg flex items-center space-x-4"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="space-y-2 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <motion.div
                      className="bg-gray-900 text-white rounded-full w-16 h-16 mb-4 shadow-xl flex items-center justify-center"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <User className="w-12 h-12" />
                    </motion.div>

                    <motion.div
                      className="ml-2"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-sm font-semibold text-gray-700">
                        <strong>Nombre:</strong> {partnerData.username}
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        <strong>Correo:</strong> {partnerData.email}
                      </p>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="mt-4 flex justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button
                      onClick={handleAddPartner}
                      className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all duration-200"
                    >
                      Agregar Compañero
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  className="mt-4 p-4 border rounded-lg bg-red-50 shadow-lg flex items-center justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-red-500 font-semibold">
                    Usuario no encontrado
                  </p>
                </motion.div>
              )}

              <motion.div
                className="mt-6 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {selectedPartners.map((partner) => (
                  <motion.div
                    key={partner.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-100 shadow-md"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        <strong>Nombre:</strong> {partner.username}
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        <strong>Correo:</strong> {partner.email}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedPartners((prev) =>
                          prev.filter((p) => p.id !== partner.id)
                        )
                      }
                      className="text-red-500 font-bold hover:underline"
                    >
                      Eliminar
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label
              htmlFor="tutor"
              className="block text-gray-700 font-semibold mb-2 text-lg"
            >
              Seleccionar Itinerario
            </label>

            <select
              id="itinerario"
              value={selectedItinerary}
              onChange={(e) => setSelectedItinerary(e.target.value)} // Asegúrate de que el valor se actualice aquí
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="" className="bg-white">
                Seleccionar Itinerario
              </option>
              <option value="Ingeniería de Software" className="bg-white">
                Ingeniería de Software
              </option>
              <option value="Sistemas Inteligentes" className="bg-white">
                Sistemas Inteligentes
              </option>
              <option value="Computación Aplicada" className="bg-white">
                Computación Aplicada
              </option>
            </select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label
              htmlFor="tutor"
              className="block text-gray-700 font-semibold mb-2 text-lg"
            >
              Seleccionar Tutor
            </label>
            <select
              id="tutor"
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
              required
            >
              <option value="">Seleccione un tutor</option>
              {Array.isArray(tutores) && tutores.length > 0 ? (
                tutores.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.username}
                  </option>
                ))
              ) : (
                <option disabled>Cargando tutores...</option>
              )}
            </select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pt-4"
          >
            <button
              type="submit"
              disabled={isSubmitting} // Deshabilitar el botón si isSubmitting es true
              className={`w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 text-lg ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? "Creando Proyecto..." : "Crear Proyecto"}
            </button>
          </motion.div>
        </div>
      </motion.form>
    </motion.div>
  );
};

// Validación de props
NewProject.propTypes = {
  onClose: PropTypes.func.isRequired, // Debe ser una función obligatoria
  fetchProjects: PropTypes.func.isRequired, // Debe ser una función obligatoria
};

export default NewProject;
