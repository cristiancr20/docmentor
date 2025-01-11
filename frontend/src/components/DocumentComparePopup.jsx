import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { API_URL } from "../core/config.js";
import * as Diff from "diff";



import DisplayNotesSidebarExample from "./DisplayNotesSidebarExample.tsx";

import { MdOutlineNavigateNext, MdOutlineNavigateBefore } from "react-icons/md";
import { FaCodeCompare } from "react-icons/fa6";
import { getCommentsByDocument } from "../core/Comments";
import { ZoomOut } from "lucide-react";



const DocumentComparePopup = ({
  documents,
  onClose,
  currentIndex,
  setCurrentIndex,
}) => {
  const [notesDocument1, setNotesDocument1] = useState([]);
  const [notesDocument2, setNotesDocument2] = useState([]);
  const [isComparing, setIsComparing] = useState(true);

  const sortedDocuments = [...documents].sort((a, b) => a.id - b.id);
  const doc1 = sortedDocuments[currentIndex];
  const doc2 = sortedDocuments[currentIndex + 1];

  const documento1 = `${API_URL}${doc1.attributes.documentFile.data[0].attributes.url}`;
  const documento2 = `${API_URL}${doc2.attributes.documentFile.data[0].attributes.url}`;

  const doc1Id = doc1.id;
  const doc2Id = doc2.id;

  useEffect(() => {
    getHighlightedAreas();
  }, [documento1, documento2]);

  const handlePrevious = () => {
    setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
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

  //COMPARAR LOS DOCUMENTOS 1 y 2 CON AYUDA DE LA LIBRERÍA DIFF
  const handleCompareClick = () => {
    // Función para obtener texto concatenado desde las notas
    const extractTextFromNotes = (notes) => {
      return notes
        .sort((a, b) => {
          const aStart = a.highlightAreas[0]?.top || 0;
          const bStart = b.highlightAreas[0]?.top || 0;
          return aStart - bStart;
        })
        .map((note) => note.quote)
        .join(" ");
    };
  
    // Extraer texto concatenado desde las notas
    const string1 = extractTextFromNotes(notesDocument1);
    const string2 = extractTextFromNotes(notesDocument2);
  
    // Comparar usando diffWords
    const diff = Diff.diffWords(string1, string2);
  
    // Procesar diferencias
    let differences = [];
    diff.forEach((part) => {
      if (part.added) {
        differences.push({
          type: "added",
          value: part.value.trim(),
          positionInDoc2: string2.indexOf(part.value.trim()),
        });
      } else if (part.removed) {
        differences.push({
          type: "removed",
          value: part.value.trim(),
          positionInDoc1: string1.indexOf(part.value.trim()),
        });
      }
    });
  
    // Mostrar las diferencias
    if (differences.length > 0) {
      console.log("Diferencias encontradas:");
      differences.forEach((diff) => {
        if (diff.type === "added") {
          console.log(
            `Texto agregado: "${diff.value}" en posición ${diff.positionInDoc2} del documento 2.`
          );
        } else if (diff.type === "removed") {
          console.log(
            `Texto eliminado: "${diff.value}" en posición ${diff.positionInDoc1} del documento 1.`
          );
        }
      });
    } else {
      console.log("No hay diferencias entre los documentos.");
    }
  };
  

  const handleCompareByHighlightAreas = () => {
    try {
      // Función para obtener texto desde las posiciones de highlightAreas
      const extractTextByHighlightAreas = (documentText, highlightAreas) => {
        // Simulamos la extracción de texto en base a las áreas destacadas
        return highlightAreas.map((area) => {
          const start = area.start || 0;
          const end = area.end || documentText.length;
          return documentText.substring(start, end);
        });
      };
  
      // Obtener las áreas destacadas del documento 1
      const text1 = notesDocument1.map((note) => ({
        id: note.id,
        content: extractTextByHighlightAreas(
          note.quote || "", // Contenido del documento 1
          note.highlightAreas
        ),
      }));
  
      // Obtener las áreas destacadas correspondientes del documento 2
      const text2 = notesDocument1.map((note) => ({
        id: note.id,
        content: extractTextByHighlightAreas(
          notesDocument2.find((n) => n.id === note.id)?.quote || "", // Contenido correspondiente del documento 2
          note.highlightAreas
        ),
      }));
  
      // Comparar los textos extraídos
      let differences = [];
      text1.forEach((note1, index) => {
        const note2 = text2[index];
        note1.content.forEach((segment1, i) => {
          const segment2 = note2.content[i] || "";
          if (segment1 !== segment2) {
            differences.push({
              id: note1.id,
              position: i,
              contentDoc1: segment1,
              contentDoc2: segment2,
            });
          }
        });
      });
  
      // Mostrar las diferencias
      if (differences.length > 0) {
        console.log("Diferencias encontradas:");
        differences.forEach((diff) => {
          console.log(
            `Diferencia en posición ${diff.position} del área destacada del documento ${diff.id}:\n` +
            `Documento 1: "${diff.contentDoc1}"\n` +
            `Documento 2: "${diff.contentDoc2}"`
          );
        });
      } else {
        console.log("No hay diferencias en las áreas destacadas.");
      }
    } catch (error) {
      console.error("Error comparando documentos:", error);
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
            Comparar Documentos
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
            onClick={handleCompareByHighlightAreas}
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
