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
      `http://localhost:1337/api/users/${userId}?populate=project_es.tutor,project_es.estudiante`
    );
    return response.data.project_es;
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

// MÉTODO PARA AGREGAR EL DOCUMENTO AL PROYECTO
export const createDocument = async (title, fileId, projectId) => {
  const documentData = {
    data: {
      title: title,
      documentFile: [fileId], // Asegúrate de que 'documentFile' es un array si Strapi lo requiere así
      project: projectId, // Enviar el ID del proyecto directamente
      fechaSubida: new Date().toISOString(), // Fecha de subida
      estado: false, // Estado inicial
    },
  };

  console.log("Document Data:", documentData);


  try {
    const response = await axios.post(
      "http://localhost:1337/api/documents",
      documentData,
    );

    console.log("Document Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error al crear el documento:", error.response || error.message);
    throw error;
  }
};



// Obtener detalles del proyecto por ID
export const getProjectById = async (projectId) => {

  try {
    const response = await axios.get(`http://localhost:1337/api/new-projects/${projectId}?populate=*`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw error;
  }
};


// Obtener documentos por ID del proyecto
export const getDocumentsByProjectId = async (projectId) => {

  try {
    // Utiliza la sintaxis correcta para aplicar el filtro
    const response = await axios.get(`http://localhost:1337/api/documents?filters[project][id][$eq]=${projectId}&populate=*`,);

    return response.data;
  } catch (error) {
    console.error("Error al obtener los documentos:", error.response?.data || error.message);
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
      `http://localhost:1337/api/users/${userId}?populate=project_ts.tutor,project_ts.estudiante`
    );
    return response.data.project_ts;
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw error;
  }
};

export const getDocumentById = async (documentId) => {
  try {
    const response = await fetch(`http://localhost:1337/api/documents/${documentId}?populate=*`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};


export const getCommentsByDocument = async (documentId) => {
  try {
    const response = await fetch(`http://localhost:1337/api/documents/${documentId}?populate=comments`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Asegúrate de que estás accediendo correctamente a los comentarios
    const comments = data?.data?.attributes?.comments?.data || [];
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};


export const addCommentToDocument = async (documentId, newComment, tutorId, highlightAreas, quote) => {


  try {
      const response = await fetch(`http://localhost:1337/api/comments`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
              data: {
                  correccion: newComment,
                  correccionTutor: tutorId,
                  document: documentId,
                  highlightAreas: JSON.stringify(Array.isArray(highlightAreas) ? highlightAreas : []), // Asegúrate de que sea un array
                  quote: quote // Usa el comentario como cita
        },
          }),
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Comment added:", result);
      return result;
  } catch (error) {
      console.error("Error adding comment:", error.message);
  }
};

