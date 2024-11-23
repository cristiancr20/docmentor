// src/utils/auth.utils.js

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
  
    Object.entries(userData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  };
  
  export const validateAuthResponse = (response) => {
    if (!response?.jwt || !response?.user) {
      throw new Error("Respuesta de autenticación inválida");
    }
    return response;
  };