import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getUserDocuments } from "../core/apiCore";

function ListarDocumentos() {
  const [documents, setDocuments] = useState([]);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    // Obtener documentos cuando el componente se monta
    const fetchDocuments = async () => {
      try {
        const docs = await getUserDocuments(userId);
        setDocuments(docs);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      }
    };

    fetchDocuments();
  }, [userId]);

  return (
    <div>
      <Navbar />
      <div className="min-h-screen  text-white p-6  rounded-lg">
        <div class="relative overflow-x-auto">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 text-center">
            <thead className="text-xs text-gray-700 uppercase bg-gray-900 dark:bg-gray-900 dark:text-gray-400 ">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr
                    className="bg-gray-800 text-white dark:border-gray-700"
                    key={doc.id}
                  >
                    <td className="px-6 py-4">{doc.title}</td>
                    <td className="px-6 py-4">{doc.publishedAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4" colSpan="2">
                    No documents found for this user.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ListarDocumentos;
