import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { API_URL } from "../core/config.js";

import { diffWords } from "diff";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

import DisplayNotesSidebarExample from "./DisplayNotesSidebarExample.tsx";

import { MdOutlineNavigateNext, MdOutlineNavigateBefore } from "react-icons/md";
import { FaCodeCompare } from "react-icons/fa6";
import { getCommentsByDocument } from "../core/Comments";

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

  const documento1 = `${API_URL}${doc1.attributes.documentFile.data[0].attributes.url}`;
  const documento2 = `${API_URL}${doc2.attributes.documentFile.data[0].attributes.url}`;

  const doc1Id = doc1.id;
  const doc2Id = doc2.id;

  const nameDocumento1 = doc1.attributes.title;
  const nameDocumento2 = doc2.attributes.title;

  useEffect(() => {
    getHighlightedAreas();
  }, [documento1, documento2]);

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

      // Combinar el texto en un solo string por documento
      const text1Str = text1.map((item) => item.text).join(" ");
      const text2Str = text2.map((item) => item.text).join(" ");

      // Encuentra las diferencias entre los documentos
      const differences = diffWords(text1Str, text2Str);
      const result = [];

      // Procesar diferencias con análisis más preciso
      differences.forEach((part, index) => {
        if (part.added) {
          result.push({
            type: "added",
            value: part.value.trim(),
            document: nameDocumento2, // Este texto fue agregado en el Documento 2
          });
        } else if (part.removed) {
          result.push({
            type: "removed",
            value: part.value.trim(),
            document: nameDocumento1, // Este texto fue eliminado del Documento 2
          });
        }
      });

      // Actualizar el estado con las diferencias procesadas
      setDifferences(result);
    } catch (error) {
      console.error("Error comparando documentos:", error);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-4/5 lg:w-11/12 h-11/12 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Comparador de Documentos
          </h2>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-500 hover:text-red-600 transition-colors duration-200 rounded-lg p-2 hover:bg-red-100"
          >
            <svg
              className="w-6 h-6 md:w-7 md:h-7"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        </div>

        <div className="flex space-x-4 h-full">
          <motion.div className="relative flex-1 bg-gray-100 p-2 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-2">
              {doc1.attributes.title}
            </h3>
            <div style={{ height: "650px", overflow: "auto" }}>
              {/* <Worker workerUrl={WORKER_URL}>
                <Viewer
                  fileUrl={documento1}
                  plugins={[highlightPluginInstance]}
                />
              </Worker> */}
              <DisplayNotesSidebarExample
                fileUrl={documento1}
                notes={notesDocument1}
                onAddNote=""
                isTutor={false}
                selectedHighlightId=""
              />
            </div>
          </motion.div>

          <motion.div className="relative flex-1 bg-gray-100 p-2 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-2">
              {doc2.attributes.title}
            </h3>
            <div style={{ height: "650px", overflow: "auto" }}>
              {/* <Worker workerUrl={WORKER_URL}>
                <Viewer
                  fileUrl={documento2}
                  plugins={[highlightPluginInstance]}
                />
              </Worker> */}

              <DisplayNotesSidebarExample
                fileUrl={documento2}
                notes={notesDocument2}
                onAddNote=""
                isTutor={false}
                selectedHighlightId=""
              />
            </div>
          </motion.div>
          <motion.div className="relative flex-1 bg-gray-100 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-4">Diferencias</h3>

            {/* Contenedor con scroll y altura fija */}
            <div
              className="grid grid-cols-2 gap-4 mb-6"
              style={{ height: "400px", overflowY: "auto" }}
            >
              {/* Columna izquierda - Eliminados */}
              <div>
                <h4 className="text-md font-semibold mb-2 text-red-600">
                  Eliminado
                </h4>
                {differences.filter((diff) => diff.type === "removed").length >
                0 ? (
                  differences
                    .filter((diff) => diff.type === "removed")
                    .map((diff, index) => (
                      <motion.div
                        key={index}
                        className="p-3 mb-2 rounded bg-red-50 border border-red-300"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-sm text-gray-700 mb-1">
                          {diff.value}
                        </p>
                        <p className="text-xs text-gray-500 italic font-semibold">
                          Documento: {diff.document}
                        </p>
                      </motion.div>
                    ))
                ) : (
                  <p className="text-sm text-gray-600">
                    No se encontraron elementos eliminados.
                  </p>
                )}
              </div>

              {/* Columna derecha - Agregados */}
              <div>
                <h4 className="text-md font-semibold mb-2 text-green-600">
                  Agregado
                </h4>
                {differences.filter((diff) => diff.type === "added").length >
                0 ? (
                  differences
                    .filter((diff) => diff.type === "added")
                    .map((diff, index) => (
                      <motion.div
                        key={index}
                        className="p-3 mb-2 rounded bg-green-50 border border-green-300"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-sm text-gray-700 mb-1">
                          {diff.value}
                        </p>
                        <p className="text-xs text-gray-500 italic font-semibold">
                          Documento: {diff.document}
                        </p>
                      </motion.div>
                    ))
                ) : (
                  <p className="text-sm text-gray-600">
                    No se encontraron elementos agregados.
                  </p>
                )}
              </div>
            </div>

            {/* Mensaje centrado */}
            <p className="col-span-2 text-center text-gray-600">
              Haz clic en "Comparar" para ver las diferencias.
            </p>

            {/* Sección de instrucciones */}
            <div className="bg-gray-700 p-4 rounded-lg border border-red-300">
              <h4 className="text-md font-semibold mb-2 text-yellow-600">
                Instrucciones
              </h4>
              <ul className="list-disc list-inside text-sm text-white">
                <li className="flex items-center mb-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                  Secciones señaladas para corrección.
                </li>
                <li className="flex items-center mb-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                  Texto eliminado.
                </li>
                <li className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                  Texto agregado.
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-900 disabled:opacity-50"
          >
            <MdOutlineNavigateBefore className="ml-2" /> Anterior
          </button>

          <button
            onClick={compareDocuments}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            <motion.div
              animate={isComparing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <FaCodeCompare />
            </motion.div>
            Comparar
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= documents.length - 2}
            className="flex items-center bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-900 disabled:opacity-50"
          >
            Siguiente <MdOutlineNavigateNext className="ml-2" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentComparePopup;
