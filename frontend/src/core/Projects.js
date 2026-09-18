import api from './apiClient';


//METODO PARA CREAR UN NUEVO PROYECTO
export const createProject = async (projectData) =>
  (await api.post(`/api/projects`, { data: projectData })).data;

//EDITAR PROYECTO
export const updateProject = async (projectId, projectData) =>
  (await api.put(`/api/projects/${projectId}`, { data: projectData })).data;

//ELIMINAR PROYECTO
export const deleteProject = async (projectId) =>
  (await api.delete(`/api/projects/${projectId}`)).data;

// OBTENER DETALLES DE UN PROYECTO POR ID DEL PROYECTO. ProyectoDetalle y el
// PDF del proyecto solo muestran nombre y correo del tutor y de los
// estudiantes; con `populate=*` venían además todos los documentos.
export const getProjectById = async (projectId) =>
  (
    await api.get(`/api/projects/${projectId}`, {
      params: {
        "populate[tutor][fields][0]": "username",
        "populate[tutor][fields][1]": "email",
        "populate[students][fields][0]": "username",
        "populate[students][fields][1]": "email",
      },
    })
  ).data.data;

export const getProjectsByTutor = async (userEmail) => {
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
};


/* OBTENER LOS PROYECTOS POR ESTUDIANTE */
export const getProjectsByEmail = async (userEmail) => {
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
};

export const getProjectsByStudents = async (userEmail) => {
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
};


export const getTutors = async (isInstitutional) => {
  // El filtro `isInstitutional` se resuelve en el cliente a propósito: en la
  // base el campo es NULL para las cuentas creadas sin él, y un
  // `$eq=false` de Strapi no encuentra NULL (en SQL, NULL = false no es
  // cierto). El resultado era una lista vacía y el select quedaba en
  // "Cargando...". Aquí NULL cuenta como no institucional.
  const response = await api.get(`/api/users?filters[rols][rolType][$eq]=tutor`);
  const tutors = response.data || [];

  const wantInstitutional = isInstitutional === true;
  return tutors.filter((tutor) => (tutor.isInstitutional === true) === wantInstitutional);
};


// Función para obtener un usuario por correo y rol de estudiante
export const getUserByEmail = async (email) => {
  const response = await api.get(
    `/api/users?filters[email][$eq]=${email}&filters[rols][rolType][$eq]=estudiante&populate=rols`
  );

  const users = response.data;

  if (users.length > 0) {
    return (users)
  }

  return null;
};


// Función para obtener el usuario por su ID
export const getUserById = async (id) => (await api.get(`/api/users/${id}`)).data;

export const getAllProjects = async () =>
  (await api.get(`/api/projects?populate=tutor,students&pagination[pageSize]=1000`)).data.data || [];

export const getAllUsers = async (rolType) => {
  const url = rolType
    ? `/api/users?filters[rols][rolType][$eq]=${rolType}&pagination[pageSize]=1000`
    : `/api/users?pagination[pageSize]=1000`;
  return (await api.get(url)).data || [];
};

export const assignTutorToProject = async (projectId, tutorId) =>
  (await api.put(`/api/projects/${projectId}`, { data: { tutor: tutorId } })).data;
