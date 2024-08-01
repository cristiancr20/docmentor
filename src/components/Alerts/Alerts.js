import Swal from 'sweetalert2';

export const successAlert = () => {
  Swal.fire({
    icon: 'success',
    title: '¡Éxito!',
    text: 'La operación se realizó correctamente',
  });
}

export const errorAlert = () => {
  Swal.fire({
    icon: 'error',
    title: '¡Error!',
    text: 'Hubo un error al realizar la operación',
  });
}
