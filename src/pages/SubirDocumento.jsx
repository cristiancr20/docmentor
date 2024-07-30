import React, { useState } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery, useMutation } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:1337/graphql', // Ajusta la URI según tu configuración de Strapi
  cache: new InMemoryCache()
});

const GET_STUDENTS = gql`
  query {
    students {
      data {
        id
        attributes {
          Name
        }
      }
    }
  }
`;

const UPLOAD_DOCUMENT = gql`
  mutation UploadDocument($title: String!, $file: Upload!, $studentId: ID!) {
    createDocument(
      input: {
        data: {
          title: $title
          document: {
            name: $file
            file: $file
          }
          students: [$studentId]
        }
      }
    ) {
      document {
        id
        title
        document {
          url
        }
        students {
          id
          Name
          Email
        }
      }
    }
  }
`;

function UploadDocumentForm() {
  const { loading: studentsLoading, error: studentsError, data: studentsData } = useQuery(GET_STUDENTS);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [uploadDocument, { loading: uploadLoading, error: uploadError }] = useMutation(UPLOAD_DOCUMENT);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    try {
      if (!title || !file || !selectedStudent) {
        alert('Por favor completa todos los campos');
        return;
      }

      const result = await uploadDocument({
        variables: {
          title,
          file,
          studentId: selectedStudent.id
        }
      });

      console.log('Document uploaded:', result.data.createDocument.document);

      // Limpiar formulario después de subir el documento
      setTitle('');
      setFile(null);
      setSelectedStudent(null);

    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  if (studentsLoading) return <p>Cargando estudiantes...</p>;
  if (studentsError) return <p>Error al cargar estudiantes: {studentsError.message}</p>;

  return (
    <div className="container mx-auto mt-4">
      <h1 className="text-2xl font-bold mb-4">Subir Documento</h1>
      <form onSubmit={handleUpload}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Título del Documento:</label>
          <input
            type="text"
            className="border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Seleccionar Estudiante:</label>
          <select
            className="appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={(e) => {
              const studentId = e.target.value;
              const student = studentsData.students.data.find(student => student.id === studentId);
              setSelectedStudent(student);
            }}
          >
            <option value="">Seleccione un estudiante...</option>
            {studentsData.students.data.map((student) => (
              <option key={student.id} value={student.id}>{student.attributes.Name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Subir Documento:</label>
          <input
            type="file"
            className="border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={handleFileChange}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={uploadLoading}
        >
          {uploadLoading ? 'Subiendo...' : 'Subir Documento'}
        </button>

        {uploadError && <p className="text-red-500 mt-2">{uploadError.message}</p>}
      </form>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <UploadDocumentForm />
    </ApolloProvider>
  );
}

export default App;
