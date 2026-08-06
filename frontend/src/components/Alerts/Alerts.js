import Swal from "sweetalert2";

/**
 * Tema de SweetAlert2 con los tokens del sistema de diseño.
 *
 * SweetAlert2 inyecta su hoja de estilos y colorea los botones en línea, así
 * que las utilidades llevan `!` para ganarle a esas reglas y `buttonsStyling`
 * se desactiva para que no vuelva a pintar el botón con su azul por defecto.
 */
const swalTheme = {
  popup: "!rounded-xl !border !border-line !bg-surface !shadow-pop",
  title: "!font-display !text-lg !font-semibold !text-content",
  htmlContainer: "!text-sm !text-muted",
  confirmButton:
    "!rounded-lg !bg-accent !px-4 !py-2 !text-sm !font-medium !text-on-accent !shadow-none",
  cancelButton:
    "!rounded-lg !border !border-line !bg-surface-2 !px-4 !py-2 !text-sm !font-medium !text-content !shadow-none",
  timerProgressBar: "!bg-accent",
};

const fireThemed = (options) =>
  Swal.fire({ ...options, customClass: swalTheme, buttonsStyling: false });

// Alerta DE SATISFACCION
export const successAlert = (mensaje) => {
  fireThemed({
    icon: "success",
    title: "¡Éxito!",
    text: mensaje,
    showConfirmButton: false,
    timer: 1500,
  });
};

//Alerta de error al subir documento
export const errorAlert = (mensaje) => {
  fireThemed({
    icon: "error",
    title: "¡Error!",
    text: mensaje,
  });
};

/**
 * Confirmación de una acción. Devuelve true si el usuario acepta.
 *
 * Sustituye a los `Swal.fire(...).then(...)` sueltos, que llevaban sus propios
 * colores en hexadecimal y repetían la misma estructura en cada llamada.
 *
 * El texto del botón se pasa en cada caso: estaba fijo como "Sí, eliminar" y
 * aparecía también al confirmar acciones que no borran nada.
 */
export const confirmAlert = async (titulo, mensaje, confirmButtonText = "Confirmar") => {
  const result = await fireThemed({
    icon: "warning",
    title: titulo,
    text: mensaje,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancelar",
    reverseButtons: true,
  });

  return result.isConfirmed;
};

// Alerta DE ADVERTENCIA
export const warningAlert = (mensaje) => {
  fireThemed({
    icon: "warning",
    title: "¡Atención!",
    text: mensaje,
  });
};

// Alerta DE ERROR AL REGISTRAR USUARIO
export const registerErrorAlert = (mensaje) => {
  fireThemed({
    icon: "error",
    title: "¡Error al registrar el usuario!",
    text: mensaje,
  });
};

//ALERTA DE INICIAR SESION CORRECTAMENTE
export const loginSuccessAlert = (username) => {
  fireThemed({
    icon: "success",
    title: "¡Bienvenido! " + username,
    text: "Has iniciado sesión correctamente",
    showConfirmButton: false,
    timer: 1500,
  });
};

//ALERTA DE ERROR AL INICIAR SESION - CREDENCIALES INCOORRECTAS
export const loginErrorAlert = (mensaje) => {
  fireThemed({
    icon: "error",
    title: "¡Error!",
    text: mensaje,
  });
};

//ALERTA DE COMPARACIÓN DE DOCUMENTOS
export const compareDocumentsAlert = (message, success) => {
  fireThemed({
    icon: success ? "success" : "warning",
    title: message,
    showConfirmButton: false,
    timer: 3000,
  });
};
