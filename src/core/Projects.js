import axios from "axios";

const API_URL = "http://localhost:1337/api";

//METODO PARA CREAR UN NUEVO PROYECTO
export const createProject = async (projectData) => {
  try {
    const response = await axios.post(
      `${API_URL}/new-projects`,
      {
        data: projectData,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error al crear el proyecto:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

//EDITAR PROYECTO
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await axios.put(
      `http://localhost:1337/api/new-projects/${projectId}`,
      {
        data: projectData,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el proyecto:", error);
    throw error;
  }
};

//ELIMINAR PROYECTO
export const deleteProject = async (projectId) => {
  try {
    const response = await axios.delete(
      `http://localhost:1337/api/new-projects/${projectId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el proyecto:", error);
    throw error;
  }
};

//OBTENER LOS PROYECTOS POR ESTUDIANTE
export const getProjectsByStudents = async (userId) => {
  try {
    const response = await axios.get(
      `http://localhost:1337/api/users/${userId}?populate=project_es.tutor,project_es.estudiante`
    );
    return response.data.project_es;
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw error;
  }
};

// OBTENER DETALLES DE UN PROYECTO POR ID
export const getProjectById = async (projectId) => {
  try {
    const response = await axios.get(
      `http://localhost:1337/api/new-projects/${projectId}?populate=*`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw error;
  }
};

//OBTENER LOS PROYECTOS POR TUTOR
export const getProjectsByTutor = async (userId) => {
  try {
    const response = await axios.get(
      `http://localhost:1337/api/users/${userId}?populate=project_ts.tutor,project_ts.estudiante`
    );
    return response.data.project_ts;
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw error;
  }
};
