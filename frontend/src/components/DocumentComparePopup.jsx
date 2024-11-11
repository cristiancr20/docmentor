import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { highlightPlugin, RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { motion } from 'framer-motion';
import { API_URL } from "../core/config";


import { MdOutlineNavigateNext, MdOutlineNavigateBefore } from "react-icons/md";
import { FaCodeCompare } from "react-icons/fa6";

import { compareDocumentsAlert } from './Alerts/Alerts';

GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';


const DocumentComparePopup = ({ documents, onClose, currentIndex, setCurrentIndex }) => {

  const [isComparing, setIsComparing] = useState(false);

  const handleCompareClick = async () => {
    await compareDocuments(); // Ejecutar la comparación de documentos
  };

  const doc1 = documents[currentIndex];
  const doc2 = documents[currentIndex + 1];

  if (!doc1 || !doc2) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-4/5 lg:w-3/5">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p>No se pueden cargar los documentos para comparar.</p>
          <button onClick={onClose} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const documento1 = `${API_URL}${doc1.attributes.documentFile.data[0].attributes.url}`;
  const documento2 = `${API_URL}${doc2.attributes.documentFile.data[0].attributes.url}`;

  const comments1 = doc1.attributes.comments.data || [];
  const comments2 = doc2.attributes.comments.data || [];

  const getHighlightAreas = (comments) => {
    return comments.flatMap(comment => {
      try {
        return JSON.parse(comment.attributes.highlightAreas);
      } catch (error) {
        console.error("Error al parsear áreas resaltadas:", error);
        return [];
      }
    });
  };

  const highlightAreas1 = getHighlightAreas(comments1);
  const highlightAreas2 = getHighlightAreas(comments2);

  const renderHighlights = (props: RenderHighlightsProps, highlightAreas) => (
    <div>
      {highlightAreas
        .filter(area => area.pageIndex === props.pageIndex)
        .map((area, idx) => (
          <div
            key={idx}
            style={Object.assign(
              {},
              {
                background: 'red',
                opacity: 0.4,
              },
              props.getCssProperties(area, props.rotation)
            )}
          />
        ))}
    </div>
  );

  const highlightPluginInstance = highlightPlugin({
    renderHighlights: (props) => renderHighlights(props, highlightAreas1),
  });

  const highlightPluginInstance2 = highlightPlugin({
    renderHighlights: (props) => renderHighlights(props, highlightAreas2),
  });

  const extractTextFromPDF = async (url) => {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const promises = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        promises.push(pdf.getPage(i).then(page => page.getTextContent()));
      }

      const pagesContent = await Promise.all(promises);
      const text = pagesContent.map(content => content.items.map(item => item.str).join(' ')).join(' ');

      return text.trim();
    } catch (error) {
      console.error(`Error al extraer texto del PDF en la URL: ${url}`, error);
      throw error; // Re-lanzar el error para manejarlo en la función que llama
    }
  };

  const compareDocuments = async () => {
    try {
      const text1 = await extractTextFromPDF(documento1);
      const text2 = await extractTextFromPDF(documento2);

      if (text1 === text2) {
        compareDocumentsAlert('Los documentos no tienen cambios', true);

      } else {
        compareDocumentsAlert('Los documentos tienen cambios.', false);
      }
    } catch (error) {
      console.error("Error al comparar documentos:", error);
      compareDocumentsAlert('Error al comparar documentos.', false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}

      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-4/5 lg:w-11/12 h-11/12 overflow-hidden">


        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Comparar Documentos
          </h2>

          <motion.button onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-500 hover:text-red-600 transition-colors duration-200 rounded-lg p-2 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
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


        <div className="flex space-x-4 h-full ">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              duration: 0.5, // Duración de la animación en segundos
              ease: "easeInOut", // Tipo de suavizado
            }}

            className="relative flex-1 bg-gray-100 p-2 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-2">{doc1.attributes.title}</h3>
            <div style={{ height: '650px', overflow: 'auto' }}>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl={documento1} plugins={[highlightPluginInstance]} />
              </Worker>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              duration: 0.5, // Duración de la animación en segundos
              ease: "easeInOut", // Tipo de suavizado
            }}

            className="relative flex-1 bg-gray-100 p-2 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-2">{doc2.attributes.title}</h3>
            <div style={{ height: '650px', overflow: 'auto' }}>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl={documento2} plugins={[highlightPluginInstance2]} />
              </Worker>
            </div>
          </motion.div>
        </div>
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="flex items-center bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <MdOutlineNavigateBefore className='ml-2' />
            Anterior
          </button>

          <button
            onClick={handleCompareClick}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            <motion.div
              animate={isComparing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: Infinity, 'ease': "linear" }}
              style={{ originX: 0.5, originY: 0.5 }}
              className="mr-2"
            >
              <FaCodeCompare />
            </motion.div>
            Comparar
          </button>

          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            disabled={currentIndex >= documents.length - 2}
            className="flex items-center bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Siguiente
            <MdOutlineNavigateNext className="ml-2" />
          </button>


        </div>

      </div>
    </motion.div>
  );
};

export default DocumentComparePopup;