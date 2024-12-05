import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },   // Simula 10 usuarios durante 30 segundos
    { duration: '1m', target: 30 },    // Luego aumenta a 50 usuarios durante 1 minuto
    { duration: '2m', target: 50 },   // Aumenta a 100 usuarios durante 2 minutos
    { duration: '1m', target: 0 }      // Finalmente, reduce a 0 usuarios durante 1 minuto (escenario de cierre)
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // Define umbrales de rendimiento (opcional)
  },
};

export default function () {
  const url = 'http://localhost:1337/api/documents'; // Ajusta la URL según tu configuración de Strapi

  // Realiza una solicitud GET a tu endpoint
  let res = http.get(url);

  // Verifica si la solicitud fue exitosa
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time is less than 500ms': (r) => r.timings.duration < 500,
    'TTFB is less than 200ms': (r) => r.timings.waiting < 200,
  });

  // Agrega una pausa de 1 segundo entre cada solicitud para simular usuarios concurrentes
  sleep(1);
}
