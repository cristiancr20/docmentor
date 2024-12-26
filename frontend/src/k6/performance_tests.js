import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Métricas personalizadas
const responseTime = new Trend('custom_response_time', true);
const requestErrors = new Counter('custom_request_errors');

export let options = {
    stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
    ],
    
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% de las solicitudes < 500ms
        http_req_failed: ['rate<0.01'],  // Menos del 1% de errores permitidos
        custom_response_time: ['avg<400'], // Tiempo de respuesta promedio < 400ms
    }
};

const BASE_URL = 'http://localhost:1337'; // Cambiar por tu URL ngrok o servidor desplegado

export default function () {
    // Definir los endpoints de la API para métodos GET
    const getEndpoints = [
        { name: 'List Projects', url: `${BASE_URL}/api/projects` },
        { name: 'List Documents', url: `${BASE_URL}/api/documents` },
        { name: 'View Document with Comments', url: `${BASE_URL}/api/documents?populate=comments` },
        { name: 'View Assigned Projects', url: `${BASE_URL}/api/projects?filters[tutor][id][$eq]=<TUTOR_ID>` },
        { name: 'View Notifications', url: `${BASE_URL}/api/notifications` },
    ];

    getEndpoints.forEach((endpoint) => {
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

    // Definir los endpoints de la API para métodos POST
    const postEndpoints = [
        {
            name: 'Create Project',
            url: `${BASE_URL}/api/projects`,
            payload: JSON.stringify({
                data: {
                    title: 'Nuevo Proyecto',
                    description: 'Descripción de prueba del proyecto',
                    projectType: 'Desarrollo',
                    itinerary: 'Desarrollo de Software',
                },
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        },
        {
            name: 'Add Comment',
            url: `${BASE_URL}/api/comments`,
            payload: JSON.stringify({
                data: {
                    correction: 'Test comment',
                }
            }),
            headers: { 'Content-Type': 'application/json' },
        },
        {
            name: 'Create Document',
            url: `${BASE_URL}/api/documents`,
            payload: JSON.stringify({
                data: {
                    title: "test document",
                    project: 20,
                    isRevised: false,
                }
            }),
            headers: { 'Content-Type': 'application/json' },
        },
        {
            name: 'Create Notification',
            url: `${BASE_URL}/api/notifications`,
            payload: JSON.stringify({
                data: {
                    message: `En el proyecto se ha subido un nuevo documento:`,
                    isRead: false,
                }
            }),
            headers: { 'Content-Type': 'application/json' },
        },

    ];

    postEndpoints.forEach((endpoint) => {
        const res = http.post(endpoint.url, endpoint.payload, { headers: endpoint.headers });

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


    // Definir los endpoints de la API para métodos PUT
    const putEndpoints = [
        {
            name: 'Update Project',
            url: `${BASE_URL}/api/projects/4177`,
            payload: JSON.stringify({
                data: {
                    title: 'Proyecto Actualizado',
                    description: 'Descripción actualizada del proyecto',
                    projectType: 'Desarrollo',
                    itinerary: 'Desarrollo de Software',
                },
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        },
        {
            name: "Update comments",
            url: `${BASE_URL}/api/comments/356`,
            payload: JSON.stringify({
                data: {
                    correction: 'Test comment updated',
                }
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        },
        {
            name: "Update Document Status Revisado",
            url: `${BASE_URL}/api/documents/356`,
            payload: JSON.stringify({
                data: {
                    isRevised: true,
                },
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        },
        {
            name: "Update Document Status No Revisado",
            url: `${BASE_URL}/api/documents/854`,
            payload: JSON.stringify({
                data: {
                    isRevised: false,
                },
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }
    ];

    putEndpoints.forEach((endpoint) => {
        const res = http.put(endpoint.url, endpoint.payload, { headers: endpoint.headers });

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
