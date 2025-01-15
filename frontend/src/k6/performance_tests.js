import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const responseTime = new Trend('custom_response_time', true);
const requestErrors = new Counter('custom_request_errors');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');

// Simulated user data with rols
const users = new SharedArray('users', function() {
    return [
        { email: 'cristian.capa20@gmail.com', password: 'Capitacr20', rol: 'estudiante' },
        { email: 'juan.f.castillo.e1@unl.edu.ec', password: 'admin1234', rol: 'tutor' },
    ];
});

export let options = {
    scenarios: {
        login: {
            executor: 'ramping-vus',
            exec: 'loginScenario',
            stages: [
                { duration: '1m', target: 10 },
                { duration: '2m', target: 50 },
                { duration: '2m', target: 100 },
                { duration: '1m', target: 0 },
            ],
        },
        getRequests: {
            executor: 'ramping-vus',
            exec: 'getScenario',
            stages: [
                { duration: '1m', target: 10 },
                { duration: '2m', target: 50 },
                { duration: '2m', target: 100 },
                { duration: '1m', target: 0 },
            ],
            startTime: '6m',
        },
        postRequests: {
            executor: 'ramping-vus',
            exec: 'postScenario',
            stages: [
                { duration: '1m', target: 10 },
                { duration: '2m', target: 50 },
                { duration: '2m', target: 100 },
                { duration: '1m', target: 0 },
            ],
            startTime: '12m',
        },
        putRequests: {
            executor: 'ramping-vus',
            exec: 'putScenario',
            stages: [
                { duration: '1m', target: 10 },
                { duration: '2m', target: 50 },
                { duration: '2m', target: 100 },
                { duration: '1m', target: 0 },
            ],
            startTime: '18m',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.05'],
        custom_response_time: ['avg<1000'],
        custom_request_errors: ['count<100'],
        http_reqs: ['rate>100'],
    },
};

const BASE_URL = 'https://revisor-documental-production.up.railway.app';

export function setup() {
    const loginResult = loginScenario();

    if (!loginResult.token) {
        throw new Error('Setup failed: Unable to obtain a valid token during login.');
    }

    const ids = getValidIds(loginResult.token);

    return { token: loginResult.token, rol: loginResult.rol, ids };
}


function getValidIds(token) {
    const AUTH_TOKEN = `Bearer ${token}`;
    const res = http.get(`${BASE_URL}/api/documents`, {
        headers: {
            Authorization: AUTH_TOKEN,
        },
    });

    if (res.status === 200) {
        const documents = JSON.parse(res.body).data || [];
        return {
            documents: documents.map((doc) => doc.id),
            projects: documents.map((doc) => doc.attributes.project?.data?.id).filter(Boolean),
            comments: documents.flatMap((doc) =>
                doc.attributes.comments?.data.map((comment) => comment.id) || []
            ),
        };
    } else {
        console.error('Failed to fetch valid IDs:', res.body);
        return { documents: [], projects: [], comments: [] }; // Siempre retorna valores válidos
    }
}


export function loginScenario() {
    const user = users[__VU % users.length];
    const loginPayload = JSON.stringify({
        identifier: user.email,
        password: user.password,
    });

    const loginRes = http.post(`${BASE_URL}/api/auth/local`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'Login' },
    });

    responseTime.add(loginRes.timings.duration);

    if (loginRes.status === 200) {
        successfulLogins.add(1);
        return { token: loginRes.json().jwt, rol: user.rol };
    } else {
        failedLogins.add(1);
        requestErrors.add(1);
        console.error(`Login failed with status ${loginRes.status}: ${loginRes.body}`);
        return { token: null, rol: null };
    }
}

export function getScenario() {
    group('Get Requests', function() {
        const getEndpoints = [
            { name: 'List Projects', url: `${BASE_URL}/api/projects` },
            { name: 'List Documents', url: `${BASE_URL}/api/documents` },
            { name: 'View Document with Comments', url: `${BASE_URL}/api/documents?populate=comments` },
            { name: 'View Notifications', url: `${BASE_URL}/api/notifications` },
        ];

        getEndpoints.forEach((endpoint) => {
            const res = http.get(endpoint.url, { tags: { name: endpoint.name } });

            responseTime.add(res.timings.duration);
            if (res.status !== 200 && res.status !== 201) {
                requestErrors.add(1);
            }

            check(res, {
                [`${endpoint.name} - is status 200 or 201`]: (r) => r.status === 200 || r.status === 201,
            });

            sleep(1);
        });
    });
}

export function postScenario() {
    const { token, rol } = loginScenario(); // Get a fresh token and rol for each VU
    group('Post Requests', function() {
        const AUTH_TOKEN = `Bearer ${token}`;

        let postEndpoints = [];

        if (rol === 'estudiante') {
            postEndpoints = [
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
            ];
        } else if (rol === 'tutor') {
            postEndpoints = [
                {
                    name: 'Add Comment',
                    url: `${BASE_URL}/api/comments`,
                    payload: JSON.stringify({
                        data: {
                            correction: 'Test comment',
                        },
                    }),
                },
            ];
        }

        postEndpoints.forEach((endpoint) => {
            const res = http.post(endpoint.url, endpoint.payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: AUTH_TOKEN,
                },
                tags: { name: endpoint.name },
            });

            responseTime.add(res.timings.duration);
            if (res.status !== 200 && res.status !== 201) {
                requestErrors.add(1);
            }

            check(res, {
                [`${endpoint.name} - is status 200 or 201`]: (r) => r.status === 200 || r.status === 201,
            });

            sleep(1);
        });

        // Simulate automatic notification creation after document creation
        if (rol === 'estudiante') {
            const notificationRes = http.post(`${BASE_URL}/api/notifications`, JSON.stringify({
                data: {
                    message: `En el proyecto se ha subido un nuevo documento:`,
                    isRead: false,
                },
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: AUTH_TOKEN,
                },
                tags: { name: 'Create Notification' },
            });

            responseTime.add(notificationRes.timings.duration);
            if (notificationRes.status !== 200 && notificationRes.status !== 201) {
                requestErrors.add(1);
            }

            check(notificationRes, {
                'Create Notification - is status 200 or 201': (r) => r.status === 200 || r.status === 201,
            });
        }
    });
}

export function putScenario(data) {
    const { token, rol } = loginScenario(); // Get a fresh token and rol for each VU
    group('Put Requests', function() {
        const AUTH_TOKEN = `Bearer ${token}`;

        let putEndpoints = [];

        if (rol === 'estudiante') {
            putEndpoints = [
                {
                    name: 'Update Project',
                    url: `${BASE_URL}/api/projects/${data.ids.projects[0] || 1}`,
                    payload: JSON.stringify({
                        data: {
                            title: 'Proyecto Actualizado',
                            description: 'Descripción actualizada del proyecto',
                            projectType: 'Desarrollo',
                            itinerary: 'Desarrollo de Software',
                        },
                    }),
                },
            ];
        } else if (rol === 'tutor') {
            putEndpoints = [
                {
                    name: 'Update comments',
                    url: `${BASE_URL}/api/comments/${data.ids.comments[0] || 1}`,
                    payload: JSON.stringify({
                        data: {
                            correction: 'Test comment updated',
                        },
                    }),
                },
                {
                    name: 'Update Document Status Revisado',
                    url: `${BASE_URL}/api/documents/${data.ids.documents[0] || 1}`,
                    payload: JSON.stringify({
                        data: {
                            isRevised: true,
                        },
                    }),
                },
                {
                    name: 'Update Document Status No Revisado',
                    url: `${BASE_URL}/api/documents/${data.ids.documents[1] || 1}`,
                    payload: JSON.stringify({
                        data: {
                            isRevised: false,
                        },
                    }),
                },
            ];
        }

        putEndpoints.forEach((endpoint) => {
            const res = http.put(endpoint.url, endpoint.payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: AUTH_TOKEN,
                },
                tags: { name: endpoint.name },
            });

            responseTime.add(res.timings.duration);
            if (res.status !== 200 && res.status !== 201) {
                requestErrors.add(1);
            }

            check(res, {
                [`${endpoint.name} - is status 200 or 201`]: (r) => r.status === 200 || r.status === 201,
            });

            sleep(1);
        });
    });
}