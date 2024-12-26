import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import LogoCarrera from "../assets/logo_carrera.png";
import LogoUniversidad from "../assets/logo_universidad.png";
import PropTypes from "prop-types";

const GeneratePdfButton = ({ userInfo }) => {
  const generatePDF = () => {
    const {
      title: nombreProyecto,
      description: descripcionProyecto,
      publishedAt,
      tutor,
      students,
      documents,
      itinerary,
    } = userInfo;

    const fechaHoy = new Date();
    const fechaFormateada = new Date(fechaHoy).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    
    const fechaDeCreacion = new Date(publishedAt).toLocaleDateString(
      "es-ES",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );



    const nombreTutor =
      tutor?.data?.attributes?.username || "Sin tutor asignado";
    const nombresEstudiantes =
      students?.data
        ?.map((student) => student.attributes?.username)
        ?.join(", ") || "Sin estudiantes asignados";

    const documentos = documents?.data || [];

    // Crear nuevo documento PDF
    const doc = new jsPDF();

    const columnaIzquierdaX = 20;
    const columnaDerechaX = 120;

    // Función para agregar el logo y encabezado
    const addHeader = () => {
      // Ajustar tamaño y posición de los logos
      const logoWidth = 30;
      const logoHeight = 20;

      doc.addImage(LogoCarrera, "PNG", 20, 10, logoWidth, logoHeight);
      doc.addImage(LogoUniversidad, "PNG", 160, 10, logoWidth, logoHeight);

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
    doc.line(20, 40, 190, 40);

    // Título del documento
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`REPORTE DE REVISIÓN DEL PROYECTO "${nombreProyecto}"`, 105, 50, {
      align: "center",
    });

    // Contenido principal
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // Información del proyecto
    const startY = 50;

    doc.setFont("helvetica", "bold");
    doc.text("Descripción:", 20, startY + 20);
    doc.setFont("helvetica", "normal");
    const descripcionLines = doc.splitTextToSize(
      descripcionProyecto || "Sin descripción",
      150
    );
    doc.text(descripcionLines, 20, startY + 27);

    // Itinerario
    doc.setFont("helvetica", "bold");
    doc.text("Itinerario:", 20, startY + 40);
    doc.setFont("helvetica", "normal");
    doc.text(itinerary || "Sin itinerario", 20, startY + 47);

    // Fechas
    doc.setFont("helvetica", "bold");
    doc.text("Fecha de Creación:", columnaIzquierdaX, startY + 60);
    doc.setFont("helvetica", "normal");
    doc.text(
      fechaDeCreacion || "No disponible",
      columnaIzquierdaX,
      startY + 67
    );

    doc.setFont("helvetica", "bold");
    doc.text("Fecha de Informe:", columnaDerechaX, startY + 60);
    doc.setFont("helvetica", "normal");
    doc.text(fechaFormateada, columnaDerechaX, startY + 67);

    // Información de participantes
    doc.setFont("helvetica", "bold");
    doc.text("Revisado por:", columnaDerechaX, startY + 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Ing. ${nombreTutor}`, columnaDerechaX, startY + 87);

    doc.setFont("helvetica", "bold");
    doc.text("Elaborado por:", columnaIzquierdaX, startY + 80);
    doc.setFont("helvetica", "normal");
    doc.text(nombresEstudiantes, columnaIzquierdaX, startY + 87);

    // Tabla de documentos
    const documentTableStartY = startY + 100;
    autoTable(doc, {
      startY: documentTableStartY,
      head: [["Título", "Fecha de Creación", "Revisado", "Fecha de Revisión"]],
      body: documentos.map((doc) => [
        doc.attributes.title,
        new Date(doc.attributes.publishedAt).toLocaleDateString(),
        doc.attributes.isRevised ? "Sí" : "No",
        new Date(doc.attributes.updatedAt).toLocaleDateString(),
      ]),
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Sección de firmas
    const firmaY = doc.lastAutoTable.finalY + 20;
    const pageWidth = doc.internal.pageSize.width;

    // Línea para la firma del tutor
    doc.setLineWidth(0.5);
    doc.line(40, firmaY, 100, firmaY);
    doc.text("Firma del Tutor", 55, firmaY + 10);

    // Línea para la firma del estudiante
    doc.line(pageWidth - 100, firmaY, pageWidth - 40, firmaY);
    doc.text("Firma del Estudiante", pageWidth - 90, firmaY + 10);

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

GeneratePdfButton.propTypes = {
  userInfo: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    publishedAt: PropTypes.string,
    tutor: PropTypes.object,
    students: PropTypes.object,
    documents: PropTypes.object,
    itinerary: PropTypes.string,
  }),
};

export default GeneratePdfButton;
