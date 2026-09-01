import api from './apiClient';


//METODO PARA CREAR UN NUEVO PROYECTO
export const createProject = async (projectData) => {
  try {
    const response = await api.post(
      `/api/projects`,
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
    const response = await api.put(
      `/api/projects/${projectId}`,
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
    const response = await api.delete(
      `/api/projects/${projectId}`
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
    const response = await api.get(
      `/api/users/${userId}?populate=project_es.tutor,project_es.students`
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
    const response = await api.get(
      `/api/projects/${projectId}?populate=*`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw error;
  }
};

export const getProjectsByTutor = async (userEmail) => {
  try {
    const response = await api.get(
      `/api/users?filters[email][$eq]=${userEmail}&populate=project_ts.tutor,project_ts.students`
    );
    // Verificar si la respuesta contiene datos
    if (!response.data || response.data.length === 0) {
      throw new Error("Tutor no encontrado o sin proyectos asignados");
    }

    // Extraer los proyectos correctamente
    const data = response.data[0]; // Accede al primer usuario encontrado
    const projects = data.project_ts || []; // Extraer proyectos

    return projects;
  } catch (error) {
    console.error("Error fetching projects by tutor email:", error);
    throw error;
  }
};


/* OBTENER LOS PROYECTOS POR ESTUDIANTE */
export const getProjectsByEmail = async (userEmail) => {
  try {
    const response = await api.get(
      `/api/users?filters[email][$eq]=${userEmail}&populate=project_es.tutor,project_es.students`
    );
    // Verificar si la respuesta contiene datos
    if (!response.data || response.data.length === 0) {
      throw new Error("Tutor no encontrado o sin proyectos asignados");
    }
    // Extraer los proyectos correctamente
    const data = response.data[0]; // Accede al primer usuario encontrado
    const projects = data.project_es || []; // Extraer proyectos

    return projects;
  } catch (error) {
    console.error("Error fetching projects by tutor email:", error);
    throw error;
  }
};

export const getProjectsByStudents = async (userEmail) => {
  try {
    const response = await api.get(
      `/api/users?filters[email][$eq]=${userEmail}&populate=project_es.tutor,project_es.students`
    );
    // Verificar si la respuesta contiene datos
    if (!response.data || response.data.length === 0) {
      throw new Error("Tutor no encontrado o sin proyectos asignados");
    }

    // Extraer los proyectos correctamente
    const studentsData = response.data[0]; // Accede al primer usuario encontrado
    const projects = studentsData.project_es || []; // Extraer proyectos

    return projects;
  } catch (error) {
    console.error("Error fetching projects by tutor email:", error);
    throw error;
  }
};



/* export const getProjectsByEmail = async (userEmail) => {
  try {
    const response = await api.get(
      `/api/users?filters[email][$eq]=${userEmail}&populate=project_ts.tutor,project_ts.students`
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


export const getTutors = async (isInstitutional) => {
  try {
    // El filtro `isInstitutional` se resuelve en el cliente a propósito: en la
    // base el campo es NULL para las cuentas creadas sin él, y un
    // `$eq=false` de Strapi no encuentra NULL (en SQL, NULL = false no es
    // cierto). El resultado era una lista vacía y el select quedaba en
    // "Cargando...". Aquí NULL cuenta como no institucional.
    const response = await api.get(`/api/users?filters[rols][rolType][$eq]=tutor`);
    const tutors = response.data || [];

    const wantInstitutional = isInstitutional === true;
    return tutors.filter((tutor) => (tutor.isInstitutional === true) === wantInstitutional);
  } catch (error) {
    console.error("Error fetching tutors:", error);
    throw error;
  }
};


// Función para obtener un usuario por correo y rol de estudiante
export const getUserByEmail = async (email) => {
  try {
    const response = await api.get(
      `/api/users?filters[email][$eq]=${email}&filters[rols][rolType][$eq]=estudiante&populate=rols`
    );

    const users = response.data;

    if (users.length > 0) {
      return (users)
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
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener el usuario por ID:', error);
    throw error;
  }
};

export const getAllProjects = async () => {
  try {
    const response = await api.get(
      `/api/projects?populate=tutor,students&pagination[pageSize]=1000`
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching all projects:", error);
    throw error;
  }
};

export const getAllUsers = async (rolType) => {
  try {
    const url = rolType
      ? `/api/users?filters[rols][rolType][$eq]=${rolType}&pagination[pageSize]=1000`
      : `/api/users?pagination[pageSize]=1000`;
    const response = await api.get(url);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const assignTutorToProject = async (projectId, tutorId) => {
  try {
    const response = await api.put(
      `/api/projects/${projectId}`,
      {
        data: {
          tutor: tutorId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error assigning tutor to project:", error);
    throw error;
  }
};


