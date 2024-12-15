import Swal from 'sweetalert2';

// Alerta DE SATISFACCION
export const successAlert = (mensaje) => {
  Swal.fire({
    icon: 'success',
    title: '¡Éxito!',
    text: mensaje,
    showConfirmButton: false,
    timer: 1500
  });
}

//Alerta de error al subir documento
export const errorAlert = (mensaje) => {
  Swal.fire({
    icon: 'error',
    title: '¡Error!',
    text: mensaje,
  });
}

// Alerta DE ADVERTENCIA
export const warningAlert = (mensaje) => {
  Swal.fire({
    icon: 'warning',
    title: '¡Atención!',
    text: mensaje,
  });
}

// Alerta DE ERROR AL REGISTRAR USUARIO
export const registerErrorAlert = (mensaje) => {
  Swal.fire({
    icon: 'error',
    title: '¡Error al registrar el usuario!',
    text: mensaje,
  });
}

//ALERTA DE INICIAR SESION CORRECTAMENTE
export const loginSuccessAlert = (username) => {
  Swal.fire({
    icon: 'success',
    title: '¡Bienvenido! '+username,
    text: 'Has iniciado sesión correctamente',
    showConfirmButton: false,
    timer: 1500
  });
}

//ALERTA DE ERROR AL INICIAR SESION - CREDENCIALES INCOORRECTAS
export const loginErrorAlert = (mensaje) => {
  Swal.fire({
    icon: 'error',
    title: '¡Error!',
    text: mensaje,
  });
}

//ALERTA DE COMPARACIÓN DE DOCUMENTOS
export const compareDocumentsAlert = (message, success) => {
  Swal.fire({
    icon: success ? 'success' : 'warning',
    title: message,
    showConfirmButton: false,
    timer: 3000
  });
}

