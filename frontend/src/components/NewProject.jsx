import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Info, UserPlus, UserRound, X } from "lucide-react";
import { createProject, getUserByEmail } from "../core/Projects";
import { successAlert, errorAlert } from "./Alerts/Alerts";
import { decryptData } from "../utils/encryption";
import Input, { Select, Textarea } from "./ui/Input";
import Button from "./ui/Button";

const ITINERARIES = [
  "Ingeniería de Software",
  "Sistemas Inteligentes",
  "Computación Aplicada",
];

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

const NewProject = ({ onClose, fetchProjects }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("Individual");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerData, setPartnerData] = useState(null);
  const [selectedItinerary, setSelectedItinerary] = useState("");
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // `userData` se recalculaba en cada render, así que era un objeto nuevo cada
  // vez. Como era dependencia del useEffect de abajo, cada respuesta provocaba
  // un render, que generaba otro objeto, que disparaba otra petición: bucle
  // infinito de llamadas a /api/users. Con useMemo la referencia es estable.
  const userData = useMemo(() => {
    const encryptedUserData = localStorage.getItem("userData");
    return encryptedUserData ? decryptData(encryptedUserData) : null;
  }, []);

  const userId = userData?.id ?? null;

  // Función para obtener el id del compañero por correo electrónico
  const getPartnerIdByEmail = async (email) => {
    try {
      const response = await getUserByEmail(email);

      if (response && Array.isArray(response) && response.length > 0) {
        // Verificar que el usuario tenga el rol de estudiante
        const user = response[0];
        const isStudent =
          user.rols &&
          user.rols.some(
            (rol) =>
              rol.rolType === "estudiante" ||
              (typeof rol === "string" && rol.toLowerCase() === "estudiante")
          );

        if (!isStudent) {
          errorAlert("El usuario debe ser un estudiante");
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          isInstitutional: user.isInstitutional,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error al obtener el ID del usuario:", error);
      errorAlert("Error al buscar el usuario");
      return null;
    }
  };

  // Manejar el cambio en el correo del compañero
  const handlePartnerEmailChange = async (e) => {
    const email = e.target.value;
    setPartnerEmail(email);

    if (email === "") {
      setPartnerData(null);
      return;
    }

    const foundPartner = await getPartnerIdByEmail(email);

    if (foundPartner) {
      try {
        // Ya tenemos los datos del usuario, no necesitamos hacer otra llamada.
        // Verificar que no sea el mismo usuario
        if (foundPartner.id === userId) {
          setPartnerData(null);
          return;
        }
        // Verificar que no esté ya en la lista
        if (selectedPartners.some((partner) => partner.id === foundPartner.id)) {
          setPartnerData(null);
          return;
        }
        setPartnerData(foundPartner);
      } catch (error) {
        console.error("Error al procesar los datos del compañero:", error);
        setPartnerData(null);
      }
    } else {
      setPartnerData(null);
    }
  };

  const handleAddPartner = () => {
    if (partnerData && !selectedPartners.some((partner) => partner.id === partnerData.id)) {
      setSelectedPartners((prev) => [...prev, partnerData]);
      setPartnerEmail(""); // Limpia el campo de entrada
      setPartnerData(null); // Reinicia los datos del compañero
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    const validEstudiantes = [userId, ...selectedPartners.map((partner) => partner.id)].filter(
      (id) => id != null
    );

    // El proyecto nace sin tutor: la asignación es competencia de la
    // coordinación, desde su propio panel.
    const projectData = {
      title: title,
      description: description,
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
    } catch (error) {
      console.error(
        "Error al crear el proyecto:",
        error.response ? error.response.data : error.message
      );
      errorAlert("Error al crear el proyecto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form {...fadeIn} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="title"
        label="Título del proyecto"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ingrese el título de su proyecto"
        required
      />

      <Textarea
        id="description"
        label="Descripción del proyecto"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describa brevemente su proyecto"
        rows={4}
        required
      />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-content">Tipo de proyecto</legend>
        <div className="flex gap-4">
          {[
            { value: "Individual", label: "Individual" },
            { value: "Grupal", label: "En pareja" },
          ].map((option) => (
            <label
              key={option.value}
              className="inline-flex cursor-pointer items-center gap-2 text-sm text-content"
            >
              <input
                type="radio"
                name="projectType"
                value={option.value}
                checked={projectType === option.value}
                onChange={(e) => setProjectType(e.target.value)}
                className="h-4 w-4 accent-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {projectType === "Grupal" && (
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface-2 p-4">
          <Input
            id="partnerEmail"
            type="email"
            label="Correo del compañero"
            value={partnerEmail}
            onChange={handlePartnerEmailChange}
            placeholder="Ingrese el correo de su compañero"
          />

          {partnerData ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-wash text-accent">
                  <UserRound className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-content">{partnerData.username}</p>
                  <p className="font-mono text-xs text-muted">{partnerData.email}</p>
                </div>
              </div>

              <Button type="button" size="sm" onClick={handleAddPartner}>
                <UserPlus className="h-4 w-4" strokeWidth={1.8} />
                Agregar compañero
              </Button>
            </div>
          ) : (
            partnerEmail && (
              <p className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">
                Usuario no encontrado
              </p>
            )
          )}

          {selectedPartners.length > 0 && (
            <ul className="flex flex-col gap-2">
              {selectedPartners.map((partner) => (
                <li
                  key={partner.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content">{partner.username}</p>
                    <p className="font-mono text-xs text-muted">{partner.email}</p>
                  </div>
                  <button
                    type="button"
                    title="Quitar compañero"
                    onClick={() =>
                      setSelectedPartners((prev) => prev.filter((p) => p.id !== partner.id))
                    }
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-danger"
                  >
                    <X className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Select
        id="itinerario"
        label="Itinerario"
        value={selectedItinerary}
        onChange={(e) => setSelectedItinerary(e.target.value)}
      >
        <option value="">Seleccionar itinerario</option>
        {ITINERARIES.map((itinerary) => (
          <option key={itinerary} value={itinerary}>
            {itinerary}
          </option>
        ))}
      </Select>

      <div className="flex gap-2 rounded-lg border border-line bg-surface-2 p-3 text-xs text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" strokeWidth={1.8} />
        <p>
          La coordinación asignará el tutor una vez creado el proyecto.
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t border-line pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Creando proyecto..." : "Crear proyecto"}
        </Button>
      </div>
    </motion.form>
  );
};

// Validación de props
NewProject.propTypes = {
  onClose: PropTypes.func.isRequired, // Debe ser una función obligatoria
  fetchProjects: PropTypes.func.isRequired, // Debe ser una función obligatoria
};

export default NewProject;
