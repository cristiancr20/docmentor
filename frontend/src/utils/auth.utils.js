// src/utils/auth.utils.js

import { decryptData, encryptData } from "./encryption";

export const ROLE_ROUTES = {
  tutor: "/tutor/dashboard",
  estudiante: "/student/dashboard",
};

export const USER_STORAGE_KEYS = ["rol", "username", "email", "userId"];

export const saveUserData = (user, userRole) => {
  const userData = {
    rol: userRole,
    username: user.username,
    email: user.email,
    userId: user.id,
  };

  console.log("Datos del usuario:", userData);

  // Convertir el objeto a JSON y encriptarlo
  const encryptedUserData = encryptData(JSON.stringify(userData));

  // Guardar el cuerpo encriptado como un solo item en localStorage
  localStorage.setItem("userData", encryptedUserData);
};

export const validateAuthResponse = (response) => {
  if (!response?.jwt || !response?.user) {
    throw new Error("Respuesta de autenticación inválida");
  }
  return response;
};


export const getUserData = () => {
  try {
    // Obtener y desencriptar los datos
    const encryptedUserData = localStorage.getItem("userData");
    const userData = JSON.parse(decryptData(encryptedUserData));

    return userData; // Devolver el objeto con los datos
  } catch (error) {
    console.error("Error al desencriptar o procesar los datos del usuario:", error);
    return null; // En caso de error, devuelve null
  }
};
