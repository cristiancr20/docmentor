/**
 * Formateo compartido.
 *
 * `formatDate` estaba reimplementado siete veces con formatos distintos (unas
 * vistas con hora, otras sin ella, otras en inglés), así que la misma fecha se
 * leía diferente según la pantalla.
 */

const LOCALE = "es-EC";

export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** "CREATE_PROJECT" -> "Create project", para las acciones de auditoría. */
export const humanizeAction = (action) => {
  if (!action) return "—";

  const words = action.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const initialsOf = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};
