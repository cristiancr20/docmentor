// src/utils/auth.utils.js

export const ROLE_ROUTES = {
  tutor: "/tutor/dashboard",
  // Apuntaba a /tutor/dashboard, así que al superadmin lo dejaba en el panel de
  // revisión en lugar del suyo.
  superadmin: "/admin/dashboard",
  estudiante: "/student/dashboard",
  coordinador: "/coordinator/dashboard",
};

export const validateAuthResponse = (response) => {
  if (!response?.jwt || !response?.user) {
    throw new Error("Respuesta de autenticación inválida");
  }
  return response;
};


// Claves que componen la sesión guardada. Se limpian juntas para que no quede
// medio estado (p. ej. token sin usuario) tras un logout o una sesión corrupta.
export const SESSION_STORAGE_KEYS = ["userData", "jwtToken", "userPermissions", "strapiUserId"];

export const clearStoredSession = () => {
  SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

// Devuelve el usuario guardado en localStorage o null si no hay sesión o el
// valor no es JSON válido (por ejemplo, una sesión antigua cifrada con AES).
export const getUserData = () => {
  const storedUserData = localStorage.getItem("userData");
  if (!storedUserData) return null;

  try {
    const userData = JSON.parse(storedUserData);
    return userData && typeof userData === "object" ? userData : null;
  } catch {
    return null;
  }
};
