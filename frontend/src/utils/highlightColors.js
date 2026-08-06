/**
 * Colores de los resaltados sobre el PDF.
 *
 * Son literales a propósito, no tokens del tema: se pintan encima de la hoja,
 * que es blanca en ambos temas, así que tienen que leerse igual de bien con el
 * tema claro y con el oscuro.
 *
 * La barra lateral de cada tarjeta de comentario usa el mismo color que su
 * resaltado, para que se vea a qué marca del documento corresponde.
 */
export const HIGHLIGHT_COLORS = {
  // Corrección sin seleccionar: ámbar suave, legible sobre texto negro.
  comment: "rgba(250, 204, 21, 0.38)",
  commentBar: "#eab308",

  // Seleccionada: pasa al acento de la aplicación, que la distingue del resto
  // sin competir con el ámbar.
  commentSelected: "rgba(79, 70, 229, 0.28)",
  commentBarSelected: "#4f46e5",

  // Comparador de versiones.
  removed: "#f87171",
  added: "#34d399",
};

export default HIGHLIGHT_COLORS;
