import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Métricas personalizadas
const responseTime = new Trend('custom_response_time', true);
const requestErrors = new Counter('custom_request_errors');

export let options = {
    scenarios: {
        login: {
            executor: 'ramping-vus',
            exec: 'loginScenario',
            stages: [
                { duration: '1m', target: 10 }, // Sube a 10 usuarios en 1 minuto
                { duration: '2m', target: 20 }, // Sube a 50 usuarios en 2 minutos
                /* { duration: '2m', target: 100 },  */// Sube a 100 usuarios en 2 minutos
                { duration: '1m', target: 0 },  // Baja a 0 usuarios en 1 minuto
            ],
        },
        /*  getRequests: {
             executor: 'constant-vus',
             exec: 'getScenario',
             vus: 10,
             duration: '1m',
             startTime: '1m',
         },
         postRequests: {
             executor: 'constant-vus',
             exec: 'postScenario',
             vus: 10,
             duration: '1m',
             startTime: '2m',
         },
         putRequests: {
             executor: 'constant-vus',
             exec: 'putScenario',
             vus: 10,
             duration: '1m',
             startTime: '3m',
         }, */
    },
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% de las solicitudes < 500ms
        http_req_failed: ['rate<0.01'],  // Menos del 1% de errores permitidos
        custom_response_time: ['avg<400'], // Tiempo de respuesta promedio < 400ms
    },
};

const BASE_URL = 'http://localhost:1337'; // Cambiar por tu URL ngrok o servidor desplegado

export function loginScenario() {
    const loginPayload = JSON.stringify({
        identifier: 'cristian.capa20@gmail.com',
        password: 'Capitacr20',
    });

    const loginRes = http.post(`${BASE_URL}/api/auth/local`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
        'Login successful': (r) => r.status === 200,
    });

    responseTime.add(loginRes.timings.duration);
    if (loginRes.status !== 200) {
        requestErrors.add(1);
    }

    sleep(1);
    return loginRes.json().jwt;
}

/* export function getScenario() {
    const getEndpoints = [
        { name: 'List Projects', url: `${BASE_URL}/api/projects` },
        { name: 'List Documents', url: `${BASE_URL}/api/documents` },
        { name: 'View Document with Comments', url: `${BASE_URL}/api/documents?populate=comments` },
        { name: 'View Notifications', url: `${BASE_URL}/api/notifications` },
    ];

    getEndpoints.forEach((endpoint) => {
        const res = http.get(endpoint.url);

        responseTime.add(res.timings.duration);
        if (res.status !== 200 && res.status !== 201) {
            requestErrors.add(1);
        }

        check(res, {
            [`${endpoint.name} - is status 200`]: (r) => r.status === 200 || r.status === 201,
        });

        sleep(1);
    });
} */

/* export function postScenario() {
    const token = loginScenario();
    const AUTH_TOKEN = `Bearer ${token}`;

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
        },
        {
            name: 'Add Comment',
            url: `${BASE_URL}/api/comments`,
            payload: JSON.stringify({
                data: {
                    correction: 'Test comment',
                },
            }),
        },
        {
            name: 'Create Document',
            url: `${BASE_URL}/api/documents`,
            payload: JSON.stringify({
                data: {
                    title: "test document",
                    project: 20,
                    isRevised: false,
                },
            }),
        },
        {
            name: 'Create Notification',
            url: `${BASE_URL}/api/notifications`,
            payload: JSON.stringify({
                data: {
                    message: `En el proyecto se ha subido un nuevo documento:`,
                    isRead: false,
                },
            }),
        },
    ];

    postEndpoints.forEach((endpoint) => {
        const res = http.post(endpoint.url, endpoint.payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: AUTH_TOKEN,
            },
        });

        responseTime.add(res.timings.duration);
        if (res.status !== 200 && res.status !== 201) {
            requestErrors.add(1);
        }

        check(res, {
            [`${endpoint.name} - is status 200`]: (r) => r.status === 200 || r.status === 201,
        });

        sleep(1);
    });
} */

/* export function putScenario() {
    const token = loginScenario();
    const AUTH_TOKEN = `Bearer ${token}`;

    const putEndpoints = [
        {
            name: 'Update Project',
            url: `${BASE_URL}/api/projects/9`,
            payload: JSON.stringify({
                data: {
                    title: 'Proyecto Actualizado',
                    description: 'Descripción actualizada del proyecto',
                    projectType: 'Desarrollo',
                    itinerary: 'Desarrollo de Software',
                },
            }),
        },
        {
            name: 'Update comments',
            url: `${BASE_URL}/api/comments/4`,
            payload: JSON.stringify({
                data: {
                    correction: 'Test comment updated',
                },
            }),
        },
        {
            name: 'Update Document Status Revisado',
            url: `${BASE_URL}/api/documents/4`,
            payload: JSON.stringify({
                data: {
                    isRevised: true,
                },
            }),
        },
        {
            name: 'Update Document Status No Revisado',
            url: `${BASE_URL}/api/documents/5`,
            payload: JSON.stringify({
                data: {
                    isRevised: false,
                },
            }),
        },
    ];

    putEndpoints.forEach((endpoint) => {
        const res = http.put(endpoint.url, endpoint.payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: AUTH_TOKEN,
            },
        });

        responseTime.add(res.timings.duration);
        if (res.status !== 200 && res.status !== 201) {
            requestErrors.add(1);
        }

        check(res, {
            [`${endpoint.name} - is status 200`]: (r) => r.status === 200 || r.status === 201,
        });

        sleep(1);
    });
}
 */