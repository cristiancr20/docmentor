import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Simula 10 usuarios durante 30 segundos
    { duration: '1m', target: 50 },   // Aumenta a 50 usuarios durante 1 minuto
    { duration: '30s', target: 0 },   // Reduce a 0 usuarios durante 30 segundos
  ],
};

const BASE_URL = 'https://silly-things-refuse.loca.lt/api'; // URL de tu API

export default function () {
  // 1. Crear un nuevo Proyecto
  const createProjectData = {
    Title: 'Nuevo Proyecto',
    Descripcion: 'Descripción de prueba del proyecto',
    tipoProyecto: 'Desarrollo',
    itinerario: 'Desarrollo de Software',
  };

  let createProjectResponse = http.post(`${BASE_URL}/projects`, JSON.stringify({
    data: { createProjectData }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(createProjectResponse, {
    'Proyecto creado': (r) => r.status === 201,
  });

  //const projectId = createProjectResponse.json().id; // Obtener ID del proyecto creado

  sleep(1); // Pausa para simular retraso entre peticiones

  // 2. Listar todos los Proyectos (GET)
  let listProjectsResponse = http.get(`${BASE_URL}/projects`);
  check(listProjectsResponse, {
    'Listado de proyectos exitoso': (r) => r.status === 200,
  });

  sleep(1); // Pausa

  /*   // 3. Actualizar el Proyecto (PUT)
    const updateProjectData = {
      Title: 'Proyecto Actualizado',
      Descripcion: 'Descripción de proyecto actualizada',
    };
  
    let updateProjectResponse = http.put(`${BASE_URL}/projects/${projectId}`, JSON.stringify(updateProjectData), {
      headers: { 'Content-Type': 'application/json' },
    });
  
    check(updateProjectResponse, {
      'Proyecto actualizado': (r) => r.status === 200,
    });
  
    sleep(1); // Pausa
  
    // 4. Eliminar el Proyecto (DELETE)
    let deleteProjectResponse = http.del(`${BASE_URL}/projects/${projectId}`);
    check(deleteProjectResponse, {
      'Proyecto eliminado': (r) => r.status === 200,
    });
   */
  sleep(1); // Pausa
}
