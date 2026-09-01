import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import CryptoJS from "crypto-js";
import { Download } from "lucide-react";
import LogoCarrera from "../assets/logo_carrera.png";
import LogoUniversidad from "../assets/logo_universidad.png";
import PropTypes from "prop-types";
import Button from "./ui/Button";

// Compresión de imágenes para mantener el PDF por debajo de 10MB.
const IMAGE_COMPRESSION = "MEDIUM";

const formatDate = (value, withTime = false) => {
  if (!value) return "No disponible";
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  if (withTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return new Date(value).toLocaleDateString("es-ES", options);
};

const GeneratePdfButton = ({ project, documents, generatedBy }) => {
  const generatePDF = () => {
    const {
      title: nombreProyecto = "Proyecto",
      description: descripcionProyecto,
      publishedAt,
      tutor,
      students,
      itinerary,
    } = project || {};

    const fechaGeneracion = new Date();
    const fechaGeneracionTexto = formatDate(fechaGeneracion, true);
    const fechaDeCreacion = formatDate(publishedAt);

    const nombreTutor =
      tutor?.data?.attributes?.username || "Sin tutor asignado";
    const nombresEstudiantes =
      students?.data
        ?.map((student) => student.attributes?.username)
        ?.join(", ") || "Sin estudiantes asignados";

    // Los documentos llegan con sus comentarios poblados (populate=*).
    const documentos = Array.isArray(documents) ? documents : [];

    // Recopilar comentarios de tutores por documento.
    const comentariosTutores = documentos.flatMap((docItem) => {
      const comentarios = docItem.attributes?.comments?.data || [];
      return comentarios
        .map((comentario) => ({
          documento: docItem.attributes?.title || "Sin título",
          correccion:
            comentario.attributes?.correction ||
            comentario.attributes?.quote ||
            "",
        }))
        .filter((c) => c.correccion.trim() !== "");
    });

    // Hash de integridad: resumen determinista del contenido del reporte.
    const contenidoIntegridad = JSON.stringify({
      proyecto: nombreProyecto,
      descripcion: descripcionProyecto || "",
      itinerario: itinerary || "",
      tutor: nombreTutor,
      estudiantes: nombresEstudiantes,
      documentos: documentos.map((docItem) => ({
        titulo: docItem.attributes?.title,
        revisado: docItem.attributes?.isRevised,
        version: docItem.attributes?.version,
        publishedAt: docItem.attributes?.publishedAt,
      })),
      comentarios: comentariosTutores,
      generadoPor: generatedBy || "Usuario",
      fechaGeneracion: fechaGeneracion.toISOString(),
    });
    const hashIntegridad = CryptoJS.SHA256(contenidoIntegridad).toString();

    // Crear nuevo documento PDF.
    const doc = new jsPDF();
    doc.setProperties({
      title: `Reporte de Proyecto - ${nombreProyecto}`,
      subject: "Reporte de proyecto DocMentor",
      author: generatedBy || "DocMentor",
      keywords: `integridad:${hashIntegridad}`,
    });

    const columnaIzquierdaX = 20;
    const columnaDerechaX = 120;

    const addHeader = () => {
      const logoWidth = 30;
      const logoHeight = 20;

      doc.addImage(
        LogoCarrera,
        "PNG",
        20,
        10,
        logoWidth,
        logoHeight,
        undefined,
        IMAGE_COMPRESSION
      );
      doc.addImage(
        LogoUniversidad,
        "PNG",
        160,
        10,
        logoWidth,
        logoHeight,
        undefined,
        IMAGE_COMPRESSION
      );

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("UNIVERSIDAD NACIONAL DE LOJA", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text("CARRERA DE COMPUTACIÓN", 105, 27, { align: "center" });
    };

    addHeader();

    // Línea separadora.
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    // Título del documento.
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`REPORTE DEL PROYECTO "${nombreProyecto}"`, 105, 50, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    const startY = 50;

    // Descripción.
    doc.setFont("helvetica", "bold");
    doc.text("Descripción:", 20, startY + 20);
    doc.setFont("helvetica", "normal");
    const descripcionLines = doc.splitTextToSize(
      descripcionProyecto || "Sin descripción",
      170
    );
    doc.text(descripcionLines, 20, startY + 27);

    // Itinerario.
    doc.setFont("helvetica", "bold");
    doc.text("Itinerario:", 20, startY + 40);
    doc.setFont("helvetica", "normal");
    doc.text(itinerary || "Sin itinerario", 20, startY + 47);

    // Fechas.
    doc.setFont("helvetica", "bold");
    doc.text("Fecha de Creación:", columnaIzquierdaX, startY + 60);
    doc.setFont("helvetica", "normal");
    doc.text(fechaDeCreacion, columnaIzquierdaX, startY + 67);

    doc.setFont("helvetica", "bold");
    doc.text("Tutor:", columnaDerechaX, startY + 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Ing. ${nombreTutor}`, columnaDerechaX, startY + 67);

    doc.setFont("helvetica", "bold");
    doc.text("Estudiantes:", columnaIzquierdaX, startY + 80);
    doc.setFont("helvetica", "normal");
    const estudiantesLines = doc.splitTextToSize(nombresEstudiantes, 170);
    doc.text(estudiantesLines, columnaIzquierdaX, startY + 87);

    // Tabla de documentos con sus estados.
    const documentTableStartY = startY + 100;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Documentos del Proyecto", columnaIzquierdaX, documentTableStartY - 4);
    autoTable(doc, {
      startY: documentTableStartY,
      head: [["Título", "Versión", "Estado", "Fecha de Subida"]],
      body: documentos.map((docItem) => [
        docItem.attributes?.title || "Sin título",
        `v${docItem.attributes?.version ?? "-"}`,
        docItem.attributes?.isRevised ? "Revisado" : "Pendiente de revisión",
        formatDate(docItem.attributes?.publishedAt),
      ]),
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Sección de comentarios de tutores.
    const comentariosStartY = doc.lastAutoTable.finalY + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Comentarios de Tutores", columnaIzquierdaX, comentariosStartY - 4);
    autoTable(doc, {
      startY: comentariosStartY,
      head: [["Documento", "Comentario / Corrección"]],
      body:
        comentariosTutores.length > 0
          ? comentariosTutores.map((c) => [c.documento, c.correccion])
          : [["—", "Sin comentarios de tutores"]],
      theme: "striped",
      styles: { fontSize: 10, cellWidth: "wrap" },
      columnStyles: { 1: { cellWidth: 120 } },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Metadatos e integridad al final del documento.
    const metadataStartY = doc.lastAutoTable.finalY + 15;
    const pageHeight = doc.internal.pageSize.height;
    if (metadataStartY > pageHeight - 40) {
      doc.addPage();
    }
    const metaY = metadataStartY > pageHeight - 40 ? 30 : metadataStartY;

    doc.setLineWidth(0.3);
    doc.line(20, metaY - 6, 190, metaY - 6);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Metadatos del Reporte", columnaIzquierdaX, metaY);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Fecha de generación: ${fechaGeneracionTexto}`,
      columnaIzquierdaX,
      metaY + 6
    );
    doc.text(
      `Generado por: ${generatedBy || "Usuario"}`,
      columnaIzquierdaX,
      metaY + 12
    );
    doc.setFont("helvetica", "bold");
    doc.text("Hash de integridad (SHA-256):", columnaIzquierdaX, metaY + 18);
    doc.setFont("helvetica", "normal");
    const hashLines = doc.splitTextToSize(hashIntegridad, 170);
    doc.text(hashLines, columnaIzquierdaX, metaY + 24);

    doc.save(`reporte-proyecto-${nombreProyecto}.pdf`);
  };

  return (
    <Button type="button" variant="secondary" onClick={generatePDF}>
      <Download className="h-4 w-4" strokeWidth={1.8} />
      Descargar PDF
    </Button>
  );
};

GeneratePdfButton.propTypes = {
  project: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    publishedAt: PropTypes.string,
    tutor: PropTypes.object,
    students: PropTypes.object,
    itinerary: PropTypes.string,
  }),
  documents: PropTypes.array,
  generatedBy: PropTypes.string,
};

export default GeneratePdfButton;
