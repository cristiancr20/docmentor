import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Métricas personalizadas
const responseTime = new Trend('custom_response_time', true);
const requestErrors = new Counter('custom_request_errors');

export let options = {
    stages: [
        { duration: '1m', target: 10 },  // Ramp-up to 10 users
        { duration: '3m', target: 50 }, // Ramp-up to 50 users
        { duration: '5m', target: 50 }, // Stay at 50 users
        { duration: '2m', target: 100 }, // Ramp-up to 100 users
        { duration: '5m', target: 100 }, // Stay at 100 users
        { duration: '2m', target: 0 },  // Ramp-down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% de las solicitudes deben responder en menos de 500ms
        http_req_failed: ['rate<0.01'],  // Menos del 1% de solicitudes deben fallar
    },
};

const BASE_URL = 'http://localhost:1337'; // Cambiar por tu URL ngrok o servidor desplegado

export default function () {
    // Definir los endpoints de la API
    const endpoints = [
        { name: 'List Projects', url: `${BASE_URL}/api/projects` },
        { name: 'List Documents', url: `${BASE_URL}/api/documents` },
        { name: 'View Document with Comments', url: `${BASE_URL}/api/documents?populate=comments` },
        { name: 'View Assigned Projects', url: `${BASE_URL}/api/projects?filters[tutor][id][$eq]=<TUTOR_ID>` },
        { name: 'View Notifications', url: `${BASE_URL}/api/notifications` },
    ];

    endpoints.forEach((endpoint) => {
        const res = http.get(endpoint.url);

        // Agregar métricas personalizadas con etiquetas por etapa
        responseTime.add(res.timings.duration, { stage: `${__VU} users` });
        if (res.status !== 200 && res.status !== 201) {
            requestErrors.add(1, { stage: `${__VU} users` });
        }

        // Chequeos de la respuesta
        check(res, {
            [`${endpoint.name} - is status 200`]: (r) => r.status === 200 || r.status === 201,
            [`${endpoint.name} - response time < 200ms`]: (r) => r.timings.duration < 200,
        });

        sleep(1); // Simular retraso entre acciones del usuario
    });
}
