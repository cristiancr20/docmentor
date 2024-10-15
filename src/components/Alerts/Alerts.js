import Swal from 'sweetalert2';

// Alerta DE SATISFACCION
export const successAlert = () => {
  Swal.fire({
    icon: 'success',
    title: '¡Éxito!',
    text: 'La operación se realizó correctamente',
    showConfirmButton: false,
    timer: 1500
  });
}

// Alerta DE ERROR
export const errorAlert = () => {
  Swal.fire({
    icon: 'error',
    title: '¡Error!',
    text: 'Hubo un error al realizar la operación',
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
export const loginErrorAlert = () => {
  Swal.fire({
    icon: 'error',
    title: '¡Error!',
    text: 'Credenciales incorrectas',
  });
}

