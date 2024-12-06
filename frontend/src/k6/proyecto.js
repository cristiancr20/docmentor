/* import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 }, // Simula 10 usuarios durante 30 segundos
    { duration: '1m', target: 20 },  // Aumenta a 20 usuarios durante 1 minuto
    { duration: '30s', target: 0 },  // Reduce a 0 usuarios durante 30 segundos
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // El 95% de las solicitudes deben ser menores a 500ms
    http_req_failed: ['rate<0.01'],   // Menos del 1% de fallos
  },
};

const BASE_URL = 'https://4d93-45-161-34-42.ngrok-free.app'; // Cambia esto por la URL de tu API

export default function () {
  // 1. Crear un nuevo proyecto (POST)
  const projectData = {
    Title: 'Nuevo Proyecto',
    Descripcion: 'Descripción de prueba',
    tutor: 2, // Cambia según tu configuración
    estudiantes: [1, 3], // IDs válidos
    FechaCreacion: new Date().toISOString(),
    tipoProyecto: 'Investigación',
    itinerario: '2024-1',
  };

  let createResponse = http.post(`${BASE_URL}/api/new-projects`, JSON.stringify({ data: projectData }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(createResponse, {
    'POST /api/new-projects status is 201': (r) => r.status === 201,
    'POST /api/new-projects response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Extraer el ID del proyecto creado
  const createdProjectId = createResponse.json()?.data?.id;
  if (!createdProjectId) {
    console.error('No se pudo obtener el ID del proyecto creado.');
    return;
  }

  sleep(1); // Pausa de 1 segundo

  // 2. Obtener todos los proyectos (GET)
  let getAllResponse = http.get(`${BASE_URL}/api/new-projects`);
  check(getAllResponse, {
    'GET /api/new-projects status is 200': (r) => r.status === 200,
    'GET /api/new-projects response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // Pausa de 1 segundo


}
 */