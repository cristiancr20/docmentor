import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { API_URL } from "../core/config.js";
import { compareDocumentsAlert } from "./Alerts/Alerts";

import { diffWords } from "diff";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

import DisplayNotesSidebarExample from "./DisplayNotesSidebarExample.tsx";

import { ChevronLeft, ChevronRight, GitCompare } from "lucide-react";
import { getCommentsByDocument } from "../core/Comments";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";

const DocumentComparePopup = ({
  documents,
  onClose,
  currentIndex,
  setCurrentIndex,
}) => {
  const [notesDocument1, setNotesDocument1] = useState([]);
  const [notesDocument2, setNotesDocument2] = useState([]);
  const [isComparing, setIsComparing] = useState(true);
  const [differences, setDifferences] = useState([]);

  const sortedDocuments = [...documents].sort((a, b) => a.id - b.id);
  const doc1 = sortedDocuments[currentIndex];
  const doc2 = sortedDocuments[currentIndex + 1];

  // Estos accesos iban sin guardas: bastaba un índice fuera de rango (el
  // llamador lo inicializa como `documents.length - 2`, que es -2 con la lista
  // vacía) o un documento sin archivo adjunto para dejar la pantalla en blanco.
  const fileUrl = (doc) => {
    const url = doc?.attributes?.documentFile?.data?.[0]?.attributes?.url;
    return url ? `${API_URL}${url}` : null;
  };

  const documento1 = fileUrl(doc1);
  const documento2 = fileUrl(doc2);

  const doc1Id = doc1?.id;
  const doc2Id = doc2?.id;

  const nameDocumento1 = doc1?.attributes?.title ?? "";
  const nameDocumento2 = doc2?.attributes?.title ?? "";

  const canCompare = Boolean(documento1 && documento2);

  useEffect(() => {
    if (canCompare) {
      getHighlightedAreas();
    }
  }, [doc1Id, doc2Id, canCompare]);

  const handlePrevious = () => {
    setDifferences([]);
    setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    setDifferences([]);
    setCurrentIndex(currentIndex + 1);
  };

  //OBTENER LAS ÁREAS RESALTADAS DE LOS DOCUMENTOS
  const getHighlightedAreas = async () => {
    try {
      const data1 = await getCommentsByDocument(doc1Id);
      const data2 = await getCommentsByDocument(doc2Id);

      const notesWithHighlightsDocumento1 = data1.map((comment) => ({
        id: comment.id,
        content: comment.attributes.correction,
        highlightAreas: JSON.parse(comment.attributes.highlightAreas) || [],
        quote: comment.attributes.quote || "",
      }));

      const notesWithHighlightsDocumento2 = data2.map((comment) => ({
        id: comment.id,
        content: comment.attributes.correction,
        highlightAreas: JSON.parse(comment.attributes.highlightAreas) || [],
        quote: comment.attributes.quote || "",
      }));

      setNotesDocument1(notesWithHighlightsDocumento1);
      setNotesDocument2(notesWithHighlightsDocumento2);
      return data1, data2;
    } catch (error) {
      /*  setError("Error fetching comments"); */
      console.log(error);
    }
  };

  const extractTextAndPositions = async (fileUrl) => {
    const pdf = await pdfjsLib.getDocument(fileUrl).promise;
    const textWithPositions = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      content.items.forEach((item) => {
        textWithPositions.push({
          text: item.str,
          x: item.transform[4], // Coordenada X
          y: item.transform[5], // Coordenada Y
          width: item.width, // Ancho del texto
          height: item.height, // Alto del texto
        });
      });
    }

    return textWithPositions;
  };

  const compareDocuments = async () => {
    try {
      // Extraer el texto y posiciones de ambos documentos
      const text1 = await extractTextAndPositions(documento1);
      const text2 = await extractTextAndPositions(documento2);

      // Función para normalizar el texto (eliminar guiones y espacios extra)
      const normalizeText = (text) => {
        return text
          .replace(/(\w+)-\s*(\w+)/g, '$1$2') // Elimina guiones entre palabras
          .replace(/\s*-\s*/g, '') // Elimina guiones sueltos
          .replace(/\s+/g, ' ') // Reemplaza múltiples espacios por uno solo
          .trim();
      };

      // Combinar el texto en un solo string por documento y normalizarlo
      const text1Str = normalizeText(text1.map((item) => item.text).join(" "));
      const text2Str = normalizeText(text2.map((item) => item.text).join(" "));

      // Encuentra las diferencias entre los documentos
      const differences = diffWords(text1Str, text2Str);
      const result = [];

      // Procesar diferencias con análisis más preciso
      differences.forEach((part) => {
        if (part.added) {
          result.push({
            type: "added",
            value: part.value.trim(),
            document: nameDocumento2,
          });
        } else if (part.removed) {
          result.push({
            type: "removed",
            value: part.value.trim(),
            document: nameDocumento1,
          });
        }
      });

      // Actualizar el estado con las diferencias procesadas
      setDifferences(result);

      // Mostrar alerta según si se encontraron diferencias o no
      if (result.length > 0) {
        compareDocumentsAlert("Se encontraron diferencias entre los documentos", true);
      } else {
        compareDocumentsAlert("No se encontraron diferencias entre los documentos", false);
      }

    } catch (error) {
      console.error("Error comparando documentos:", error);
      compareDocumentsAlert("Error al comparar los documentos", false);
    } finally {
      setIsComparing(false);
    }
  };

  // Hacen falta dos versiones con archivo para poder comparar.
  if (!canCompare) {
    return (
      <Modal
        open
        onClose={onClose}
        size="sm"
        title="No hay versiones que comparar"
        footer={
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        <EmptyState
          icon={GitCompare}
          title="Faltan versiones"
          description="Se necesitan al menos dos versiones con archivo adjunto para usar el comparador."
        />
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Comparador de documentos"
      description="Revisa dos versiones lado a lado y resalta sus diferencias."
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            Anterior
          </Button>

          <Button onClick={compareDocuments}>
            <motion.span
              animate={isComparing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-flex"
            >
              <GitCompare className="h-4 w-4" strokeWidth={1.8} />
            </motion.span>
            Comparar
          </Button>

          <Button
            variant="secondary"
            onClick={handleNext}
            disabled={currentIndex >= documents.length - 2}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface-2 p-3">
          <h3 className="mb-2 font-display text-sm font-semibold text-content">
            {nameDocumento1}
          </h3>
          <div className="h-[600px] overflow-auto rounded-lg bg-surface">
            <DisplayNotesSidebarExample
              fileUrl={documento1}
              notes={notesDocument1}
              onAddNote=""
              isTutor={false}
              selectedHighlightId=""
            />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface-2 p-3">
          <h3 className="mb-2 font-display text-sm font-semibold text-content">
            {nameDocumento2}
          </h3>
          <div className="h-[600px] overflow-auto rounded-lg bg-surface">
            <DisplayNotesSidebarExample
              fileUrl={documento2}
              notes={notesDocument2}
              onAddNote=""
              isTutor={false}
              selectedHighlightId=""
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface-2 p-4">
          <h3 className="font-display text-sm font-semibold text-content">Diferencias</h3>

          <div className="grid h-[380px] grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-medium uppercase tracking-wide text-danger">
                Eliminado
              </h4>
              {differences.filter((diff) => diff.type === "removed").length > 0 ? (
                differences
                  .filter((diff) => diff.type === "removed")
                  .map((diff, index) => (
                    <motion.div
                      key={index}
                      className="rounded-lg border border-line bg-danger-wash p-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <p className="text-sm text-content">{diff.value}</p>
                      <p className="mt-1 font-mono text-xs text-muted">{diff.document}</p>
                    </motion.div>
                  ))
              ) : (
                <p className="text-sm text-muted">No se encontraron elementos eliminados.</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-medium uppercase tracking-wide text-ok">Agregado</h4>
              {differences.filter((diff) => diff.type === "added").length > 0 ? (
                differences
                  .filter((diff) => diff.type === "added")
                  .map((diff, index) => (
                    <motion.div
                      key={index}
                      className="rounded-lg border border-line bg-ok-wash p-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <p className="text-sm text-content">{diff.value}</p>
                      <p className="mt-1 font-mono text-xs text-muted">{diff.document}</p>
                    </motion.div>
                  ))
              ) : (
                <p className="text-sm text-muted">No se encontraron elementos agregados.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Instrucciones
            </h4>
            <ul className="flex flex-col gap-1.5 text-sm text-muted">
              <li className="flex items-center gap-2">
                {/* Amarillo literal: es el mismo color con el que el visor pinta los
                    resaltados sobre el PDF, así que la leyenda debe coincidir. */}
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: "yellow" }}
                />
                Secciones señaladas para corrección.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger" />
                Texto eliminado: estaba en la versión anterior (izquierda) y ya no está en
                la más reciente (derecha).
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ok" />
                Texto agregado: aparece en la versión más reciente (derecha) y no en la
                anterior (izquierda).
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted">
              Pulsa &quot;Comparar&quot; para calcular las diferencias.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

DocumentComparePopup.propTypes = {
  documents: PropTypes.array.isRequired,
  onClose: PropTypes.func,
  currentIndex: PropTypes.number.isRequired,
  setCurrentIndex: PropTypes.func,
};

export default DocumentComparePopup;
