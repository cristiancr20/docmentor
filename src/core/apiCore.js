import axios from "axios";

const API_URL = "http://localhost:1337/api";

//METODO PARA REGISTRAR UN USUARIO
export const registerUser = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/local/register`, data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

//METODO PARA OBTENER LOS ROLES
export const getRoles = async () => {
  try {
    const response = await axios.get(`${API_URL}/rols`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};





//*******************ESTUDIANTE************************* 
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

//OBTENER LOS PROYECTOS POR ESTUDIANTE
export const getProjectsByStudents = async (userId) => {
  try {
    const response = await axios.get(
      `http://localhost:1337/api/users/${userId}?populate=new_project_es.tutor,new_project_es.estudiante`
    );
    return response.data.new_project_es;
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw error;
  }
};


//METODO PARA SUBIR DOCUMENTO
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("files", file);

  const token = localStorage.getItem("jwtToken"); // Obtener el token

  if (!token) {
    throw new Error("Token JWT no encontrado");
  }

  const response = await axios.post(
    "http://localhost:1337/api/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`, // Añadir el token en los headers
      },
    }
  );

  return response.data[0]; // Retorna el primer archivo subido
};

// Método para crear la entrada en la entidad 'document'
export const createDocument = async (title, fileId, userId) => {
  const documentData = {
    data: {
      title: title,
      document: [fileId],
      user: userId,
    },
  };

  const token = localStorage.getItem("jwtToken"); // Obtener el token

  if (!token) {
    throw new Error("Token JWT no encontrado");
  }

  const response = await axios.post(
    "http://localhost:1337/api/documents",
    documentData,
    {
      headers: {
        Authorization: `Bearer ${token}`, // Añadir el token en los headers
      },
    }
  );

  return response.data;
};

// Función para obtener los documentos de un usuario específico
export const getUserDocuments = async (userId) => {
  try {
    const response = await axios.get(
      `http://localhost:1337/api/users/${userId}?populate=documents`
    );
    return response.data.documents;
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw error;
  }
};

// Obtener detalles del proyecto
export const getProject = async (projectId) => {
  try {
    const response = await axios.get(`http://localhost:1337/api/new-projects/${projectId}`);
    return response.data?.data?.attributes || {};
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

// Función para obtener documentos de un proyecto
export const getDocuments = async (projectId) => {
  try {
    const response = await axios.get(`http://localhost:1337/api/new-projects/${projectId}?populate=documents`);
    const documents = response.data?.data?.attributes?.documents?.data || [];
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

// Función para obtener versiones de un documento
export const getDocumentVersions = async (documentId) => {
  try {
    // Obtener el documento inicial
    const response = await axios.get(`http://localhost:1337/api/documents/${documentId}?populate=*`);
    const document = response.data?.data?.attributes;
    const versions = [];

    // Obtener la versión más reciente
    if (document.last_version?.data) {
      let currentVersion = document.last_version.data;
      while (currentVersion) {
        versions.push(currentVersion);
        const prevResponse = await axios.get(`http://localhost:1337/api/documents/${currentVersion.id}?populate=*`);
        currentVersion = prevResponse.data?.data?.attributes.previous_version?.data;
      }
    }

    // Ordenar las versiones para que la más reciente esté primero
    return versions.reverse();
  } catch (error) {
    console.error('Error fetching document versions:', error);
    throw error;
  }
};


//*************** TUTOR ************* */
//OBTENER LOS PROYECTOS POR TUTOR
export const getProjectsByTutor = async (userId) => {
  try {
    const response = await axios.get(
      `http://localhost:1337/api/users/${userId}?populate=new_project_ts.tutor,new_project_ts.estudiante`
    );
    return response.data.new_project_ts;
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw error;
  }
};