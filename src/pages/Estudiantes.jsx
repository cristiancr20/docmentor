import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:1337/graphql',
  cache: new InMemoryCache()
});

const GET_STUDENTS = gql`
  query {
    students {
      data {
        id
        attributes {
          Name
          Email
          documents {
            data {
              attributes {
                title
                document {
                  data {
                    attributes {
                      name
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const BASE_URL = 'http://localhost:1337';

function Students() {
  const { loading, error, data } = useQuery(GET_STUDENTS);

  if (loading) return <div className="text-center"><div className="spinner"></div></div>;
  if (error) return <div className="alert">{error.message}</div>;

  return (
    <div className="container mx-auto mt-4">
      {data.students.data.map((dato) => {
        const { attributes } = dato;
        return (
          <div key={dato.id} className="bg-white rounded-lg shadow-lg mb-4">
            <div className="p-4">
              <h1 className="text-xl font-bold mb-2">{attributes.Name}</h1>
              <p className="text-gray-600 mb-2">{attributes.Email}</p>
              <h2 className="text-lg font-semibold mb-2">Documentos:</h2>
              {attributes.documents && attributes.documents.data.length > 0 ? (
                <div className="space-y-4">
                  {attributes.documents.data.map((doc, index) => (
                    <div key={index} className="bg-gray-100 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">{doc.attributes.title}</h3>
                      {doc.attributes.document.data.map((file, fileIndex) => (
                        <div key={fileIndex} className="flex items-center justify-between">
                          <p className="text-blue-500">{file.attributes.name}</p>
                          <a href={`${BASE_URL}${file.attributes.url}`} target="_blank" rel="noopener noreferrer" className="text-white bg-blue-500 hover:bg-blue-600 py-1 px-4 rounded-lg">Previsualizar</a>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No hay documentos</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <Students />
    </ApolloProvider>
  );
}

export default App;
