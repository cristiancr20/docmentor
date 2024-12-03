import React from "react";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";
import logo_computacion from "../assets/logo_computacion.jpg";
import logo_unl from "../assets/logo_unl.png";

const GeneratePdfButton = ({ userInfo }) => {
  const generatePDF = () => {
    const {
      Title: nombreProyecto,
      Descripcion: descripcionProyecto,
      FechaCreacion: fechaCreacion,
      tutor,
      estudiante,
    } = userInfo;

    const fechaHoy = new Date();
    const fechaFormateada = `${fechaHoy.getFullYear()}-${fechaHoy.getMonth()}-${fechaHoy.getDate()}`;

    const nombreTutor =
      tutor?.data?.attributes?.username || "Sin tutor asignado";
    const nombreEstudiante =
      estudiante?.data?.attributes?.username || "Sin estudiante asignado";

    // Crear nuevo documento PDF
    const doc = new jsPDF();

    const columnaIzquierdaX = 20;
    const columnaDerechaX = 120;

    // Función para agregar el logo y encabezado
    const addHeader = () => {
      // Agregar logo de la universidad (asumiendo que tienes la imagen)
      doc.addImage(logo_computacion, "JPEG", 20, 10, 40, 40);
      doc.addImage(logo_unl, "PNG", 150, 10, 40, 40);

      // Título de la institución
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("UNIVERSIDAD NACIONAL DE LOJA", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text("CARRERA DE COMPUTACIÓN", 105, 27, { align: "center" });
    };

    // Agregar encabezado
    addHeader();

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);

    // Título del documento
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE REVISIÓN DEL PROYECTO", 105, 65, { align: "center" });

    // Contenido principal
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // Información del proyecto
    const startY = 80;
    doc.setFont("helvetica", "bold");
    doc.text("Nombre del Proyecto:", 20, startY);
    doc.setFont("helvetica", "normal");
    doc.text(nombreProyecto, 20, startY + 7);

    doc.setFont("helvetica", "bold");
    doc.text("Descripción:", 20, startY + 20);
    doc.setFont("helvetica", "normal");
    const descripcionLines = doc.splitTextToSize(descripcionProyecto, 150);
    doc.text(descripcionLines, 20, startY + 27);

    // Fechas (Columna 1)
    doc.setFont("helvetica", "bold");
    doc.text("Fecha de Creación:", columnaIzquierdaX, startY + 45);
    doc.setFont("helvetica", "normal");
    doc.text(fechaCreacion, columnaIzquierdaX, startY + 52);

    doc.setFont("helvetica", "bold");
    doc.text("Fecha de Revisión:", columnaDerechaX, startY + 45);
    doc.setFont("helvetica", "normal");
    doc.text(fechaFormateada, columnaDerechaX, startY + 52);

    // Información de participantes (Columna 2)
    doc.setFont("helvetica", "bold");
    doc.text("Revisado por:", columnaDerechaX, startY + 85);
    doc.setFont("helvetica", "normal");
    doc.text(`Ing. ${nombreTutor}`, columnaDerechaX, startY + 92);

    doc.setFont("helvetica", "bold");
    doc.text("Elaborado por:", columnaIzquierdaX, startY + 85);
    doc.setFont("helvetica", "normal");
    doc.text(nombreEstudiante, columnaIzquierdaX, startY + 92);

    // Sección de firmas
    const firmaY = 220;
    const pageWidth = doc.internal.pageSize.width;
    // Calcular el centro para la línea de firma
    const lineWidth = 60; // Ancho de la línea
    const lineStartX = (pageWidth - lineWidth) / 2; // Centrar la línea
    doc.line(lineStartX, firmaY, lineStartX + lineWidth, firmaY); // Línea centrada para firma del docente

    doc.setFontSize(10);
    doc.text("Firma del Docente", 105, firmaY + 5, { align: "center" });
    doc.text(`Ing. ${nombreTutor}`, 105, firmaY + 10, { align: "center" });

    // Guardar el PDF
    doc.save("reporte-proyecto.pdf");
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="font-bold mb-4 ml-4 bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700"
      onClick={generatePDF}
    >
      Generar Informe de revisión
    </motion.button>
  );
};

export default GeneratePdfButton;
