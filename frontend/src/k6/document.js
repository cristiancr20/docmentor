/* import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },   // Simula 10 usuarios durante 30 segundos
    { duration: '1m', target: 30 },    // Luego aumenta a 30 usuarios durante 1 minuto
    { duration: '2m', target: 50 },   // Aumenta a 50 usuarios durante 2 minutos
    { duration: '1m', target: 0 }      // Finalmente, reduce a 0 usuarios durante 1 minuto (escenario de cierre)
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],       // El 95% de las solicitudes deben completarse en menos de 500ms
    http_req_failed: ['rate<0.01'],         // Menos del 1% de las solicitudes deben fallar
    http_reqs: ['count>2000'],              // Debe manejar al menos 2000 solicitudes
    http_req_waiting: ['p(95)<200'],        // Tiempo hasta el primer byte < 200ms para el 95%
  },
};

export default function () {
  const url = 'https://cc05-45-161-34-42.ngrok-free.app/api/documents'; // Ajusta la URL según tu configuración de Strapi

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
 */