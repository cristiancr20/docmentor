import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jsPDF } from "jspdf";
import GeneratePdfButton from "../GeneratePdfButton";

// Mock de los assets de imagen (los tests no necesitan los binarios png).
// En Vitest el factory de vi.mock devuelve el módulo completo: la export
// por defecto va en `default`.
vi.mock("../../assets/logo_carrera.png", () => ({ default: "logo_carrera.png" }));
vi.mock("../../assets/logo_universidad.png", () => ({ default: "logo_universidad.png" }));

vi.mock("jspdf", () => ({ jsPDF: vi.fn() }));
vi.mock("jspdf-autotable", () => ({ default: vi.fn() }));

let mockPdfInstance;

const buildPdfInstance = () => ({
  setProperties: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setLineWidth: vi.fn(),
  line: vi.fn(),
  text: vi.fn(),
  addImage: vi.fn(),
  addPage: vi.fn(),
  splitTextToSize: vi.fn((t) => (Array.isArray(t) ? t : [t])),
  save: vi.fn(),
  lastAutoTable: { finalY: 150 },
  internal: { pageSize: { width: 210, height: 297 } },
});

const buildProject = () => ({
  title: "Tesis de Grado",
  description: "Un proyecto de titulación",
  publishedAt: "2026-01-01T10:00:00.000Z",
  itinerary: "Software",
  tutor: { data: { attributes: { username: "Juan Perez" } } },
  students: { data: [{ attributes: { username: "Ana Lopez" } }] },
});

const buildDocuments = () => [
  {
    id: 1,
    attributes: {
      title: "Capitulo 1",
      version: 1,
      isRevised: true,
      publishedAt: "2026-02-01T10:00:00.000Z",
      comments: {
        data: [
          { id: 5, attributes: { correction: "Revisar la introducción" } },
        ],
      },
    },
  },
];

describe("GeneratePdfButton", () => {
  beforeEach(() => {
    // Cada test recibe una instancia limpia. El componente hace `new jsPDF()`,
    // y Vitest exige que la implementación sea construible (function, no arrow).
    mockPdfInstance = buildPdfInstance();
    jsPDF.mockImplementation(function () {
      return mockPdfInstance;
    });
  });

  it("muestra el botón Descargar PDF", () => {
    render(
      <GeneratePdfButton project={buildProject()} documents={buildDocuments()} generatedBy="Ana" />
    );
    expect(
      screen.getByRole("button", { name: /descargar pdf/i })
    ).toBeInTheDocument();
  });

  it("genera el PDF con nombre de archivo del proyecto al hacer clic", async () => {
    render(
      <GeneratePdfButton project={buildProject()} documents={buildDocuments()} generatedBy="Ana" />
    );

    await userEvent.click(screen.getByRole("button", { name: /descargar pdf/i }));

    expect(mockPdfInstance.save).toHaveBeenCalledWith(
      "reporte-proyecto-Tesis de Grado.pdf"
    );
  });

  it("incluye un hash de integridad en los metadatos del PDF", async () => {
    render(
      <GeneratePdfButton project={buildProject()} documents={buildDocuments()} generatedBy="Ana" />
    );

    await userEvent.click(screen.getByRole("button", { name: /descargar pdf/i }));

    expect(mockPdfInstance.setProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: expect.stringMatching(/^integridad:[a-f0-9]{64}$/),
      })
    );
  });

  it("no falla cuando no hay documentos ni comentarios", async () => {
    render(
      <GeneratePdfButton project={buildProject()} documents={[]} generatedBy="Ana" />
    );

    await userEvent.click(screen.getByRole("button", { name: /descargar pdf/i }));

    expect(mockPdfInstance.save).toHaveBeenCalled();
  });
});
