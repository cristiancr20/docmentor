import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Métricas personalizadas
const responseTime = new Trend('custom_response_time', true);
const requestErrors = new Counter('custom_request_errors');

export let options = {
    stages: [
        { duration: '30s', target: 10 },  // Ramp-up to 10 users
        { duration: '30s', target: 0 },  // Ramp-down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% de las solicitudes deben responder en menos de 500ms
        http_req_failed: ['rate<0.01'],  // Menos del 1% de solicitudes deben fallar
    },
};

const BASE_URL = 'http://localhost:1337'; // Cambiar por tu URL ngrok o servidor desplegado

export default function () {

    // Definir los endpoints de la API para métodos POST
    const postEndpoints = [
        {
            name: "Update Document Status No Revisado",
            url: `${BASE_URL}/api/documents/354`,
            payload: JSON.stringify({
                data: {
                    isRevised: false,
                },
            }),
            headers: { 'Content-Type': 'application/json' },
        },
    ];

    postEndpoints.forEach((endpoint) => {
        const res = http.put(endpoint.url, endpoint.payload, { headers: endpoint.headers });

        // Métricas personalizadas
        responseTime.add(res.timings.duration, { stage: `${__VU} users` });
        if (res.status !== 200 && res.status !== 201) {
            requestErrors.add(1, { stage: `${__VU} users` });
        }

        // Chequeos y detalles de depuración
        const success = check(res, {
            [`${endpoint.name} - is status 200`]: (r) => r.status === 200 || r.status === 201,
            [`${endpoint.name} - response time < 200ms`]: (r) => r.timings.duration < 200,
        });

        if (!success) {
            console.log(`Failed: ${endpoint.name}`);
            console.log(`Status: ${res.status}`);
            console.log(`Body: ${res.body}`);
        }

        sleep(1); // Simula retraso entre acciones del usuario
    });
}