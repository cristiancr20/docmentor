import axios from "axios";

import { API_URL } from "./config";

//METODO PARA CREAR UN NUEVO PROYECTO
export const createProject = async (projectData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/projects`,
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
      `${API_URL}/api/projects/${projectId}`,
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
      `${API_URL}/api/projects/${projectId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el proyecto:", error);
    throw error;
  }
};

//OBTENER LOS PROYECTOS POR ESTUDIANTE
/* export const getProjectsByStudents = async (userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/users/${userId}?populate=project_es.tutor,project_es.students`
    );
    return response.data.project_es;
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw error;
  }
}; */

// OBTENER DETALLES DE UN PROYECTO POR ID DEL PROYECTO
export const getProjectById = async (projectId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/projects/${projectId}?populate=*`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw error;
  }
};

/* export const getProjectsByTutor = async (userEmail) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/users?filters[email][$eq]=${userEmail}&populate=project_ts.tutor,project_ts.students`
    );
    // Verificar si la respuesta contiene datos
    if (!response.data || response.data.length === 0) {
      throw new Error("Tutor no encontrado o sin proyectos asignados");
    }

    // Extraer los proyectos correctamente
    const tutorData = response.data[0]; // Accede al primer usuario encontrado
    const projects = tutorData.project_ts || []; // Extraer proyectos

    return projects;
  } catch (error) {
    console.error("Error fetching projects by tutor email:", error);
    throw error;
  }
}; */



export const getProjectsByEmail = async (userEmail) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/users?filters[email][$eq]=${userEmail}&populate=project_ts.tutor,project_ts.students`
    );
    // Verificar si la respuesta contiene datos
    if (!response.data || response.data.length === 0) {
      throw new Error("Tutor no encontrado o sin proyectos asignados");
    }

    // Extraer los proyectos correctamente
    const tutorData = response.data[0]; // Accede al primer usuario encontrado
    const projects = tutorData.project_ts || []; // Extraer proyectos

    return projects;
  } catch (error) {
    console.error("Error fetching projects by tutor email:", error);
    throw error;
  }
};


export const getTutors = async (isInstitutional) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/users?filters[rols][rolType][$eq]=tutor&filters[isInstitutional][$eq]=${isInstitutional}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching tutors:", error);
    throw error;
  }
};


// Función para obtener un usuario por correo y rol de estudiante
export const getUserByEmail = async (email) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/users?filters[email][$eq]=${email}&filters[rols][rolType][$eq]=estudiante&populate=rols`
    );

    const users = response.data;
    console.log("users", users);

    if (users.length > 0) {
      return {
        id: users[0].id,
        isInstitutional: users[0].isInstitutional || false, // Asegurar que tenga valor
      };
    }

    return null;
  } catch (error) {
    console.error("Error al obtener el usuario por email:", error);
    throw error;
  }
};





// Función para obtener el usuario por su ID
export const getUserById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener el usuario por ID:', error);
    throw error;
  }
};


