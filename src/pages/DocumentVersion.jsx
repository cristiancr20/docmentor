import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocuments, getDocumentVersions, getProject } from '../core/apiCore';
import Timeline from '../components/TimeLine';
import Navbar from '../components/Navbar';

const DocumentVersions = () => {
  const { projectId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [versions, setVersions] = useState({});
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (projectId) {
        try {
          // Obtener detalles del proyecto
          const project = await getProject(projectId);
          setProjectName(project.Title || 'Nombre del Proyecto');

          // Obtener documentos del proyecto
          const docs = await getDocuments(projectId);
          setDocuments(docs);

          // Obtener versiones para cada documento
          const versionPromises = docs.map(doc => getDocumentVersions(doc.id));
          const versionsArray = await Promise.all(versionPromises);

          const versionsMap = {};
          docs.forEach((doc, index) => {
            versionsMap[doc.id] = versionsArray[index];
          });

          setVersions(versionsMap);
        } catch (error) {
          console.error('Error fetching project, documents or versions:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.error('Project ID is undefined');
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Ordenar documentos por fecha de creación, el más reciente primero
  const sortedDocuments = [...documents].sort((a, b) => new Date(b.attributes.createdAt) - new Date(a.attributes.createdAt));

  return (
    <div>
      <Navbar />
      <h1 className="text-2xl font-bold m-4 text-center">{projectName}</h1>
      
      {sortedDocuments.map(document => (
        <div key={document.id} className="mb-8">
          <Timeline versions={versions[document.id] || []} />
        </div>
      ))}
    </div>
  );
};

export default DocumentVersions;
