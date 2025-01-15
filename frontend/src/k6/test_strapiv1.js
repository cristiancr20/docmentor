import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import exec from 'k6/execution';

// Initialize custom metrics
const responseTime = new Trend('response_time');
const requestErrors = new Counter('request_errors');

const BASE_URL = 'https://revisor-documental-production.up.railway.app';

// Configuración de la prueba
export const options = {
    stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        'response_time': ['p(95)<500'],
        'request_errors': ['count<10'], // No más de 10 errores
    },
};

// Aquí debes agregar los tokens generados en Postman
const sessions = {
    estudiante: {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzM2ODg5MDQ4LCJleHAiOjE3Mzk0ODEwNDh9.Td_WvMeU8FZK8fspQ0RaByQo5abHzxFm2xNSeuY651w',  // Token generado en Postman para el estudiante
        rol: 'estudiante',
    },
    tutor: {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzM2ODg5MTA4LCJleHAiOjE3Mzk0ODExMDh9.3lGXMRwejW5S1tqA8I-uhILbdp4J_XiPum4CjlvDzTs',  // Token generado en Postman para el tutor
        rol: 'tutor',
    },
};

export function setup() {
    // Validate sessions
    if (!sessions.estudiante?.jwt || !sessions.tutor?.jwt) {
        throw new Error('No se encontraron tokens JWT válidos para estudiante y/o tutor');
    }

    return {
        sessions: sessions,
        ids: {
            projects: [2, 3],
            documents: [1, 2],
            comments: [1, 2],
        },
        endpoints: {
            get: [
                { name: 'List Projects', url: '/api/projects' },
                { name: 'List Documents', url: '/api/documents' },
                { name: 'View Document with Comments', url: '/api/documents?populate=comments' },
                { name: 'View Notifications', url: '/api/notifications' },
            ]
        }
    };
}
    export default function (data) {
        // Use metrics declared in global scope
        // Determine role based on iteration
        const rol = exec.scenario.iterationInInstance % 2 === 0 ? 'estudiante' : 'tutor';
        
        // Set headers for current user
        const headers = {
            Authorization: `Bearer ${data.sessions[rol].jwt}`,
            'Content-Type': 'application/json',
        };

        // GET Requests
        group('Get Requests', function () {
            data.endpoints.get.forEach((endpoint) => {
                const response = http.get(`${BASE_URL}${endpoint.url}`, { headers });
                responseTime.add(response.timings.duration);
                check(response, {
                    [`${endpoint.name} status 200`]: (r) => r.status === 200,
                }) || requestErrors.add(1);
            });
        });

        sleep(1);

        // POST Requests
        group('Post Requests', function () {
            const postEndpoints = {
                estudiante: [
                    {
                        name: 'Create Project',
                        url: '/api/projects',
                        payload: {
                            data: {
                                title: 'Nuevo Proyecto',
                                description: 'Descripción de prueba del proyecto',
                                projectType: 'Desarrollo',
                                itinerary: 'Desarrollo de Software',
                            },
                        },
                    },
                    {
                        name: 'Create Document',
                        url: '/api/documents',
                        payload: {
                            data: {
                                title: 'test document',
                                project: 20,
                                isRevised: false,
                            },
                        },
                    },
                ],
                tutor: [
                    {
                        name: 'Add Comment',
                        url: '/api/comments',
                        payload: {
                            data: {
                                correction: 'Test comment',
                            },
                        },
                    },
                ],
            };

            postEndpoints[rol]?.forEach((endpoint) => {
                const response = http.post(
                    `${BASE_URL}${endpoint.url}`,
                    JSON.stringify(endpoint.payload),
                    { headers }
                );
                responseTime.add(response.timings.duration);
                check(response, {
                    [`${endpoint.name} status 200`]: (r) => r.status === 200,
                }) || requestErrors.add(1);
            });
        });

        sleep(1);

        // PUT Requests
        group('Put Requests', function () {
            const putEndpoints = {
                estudiante: [
                    {
                        name: 'Update Project',
                        url: `/api/projects/${data.ids.projects[0]}`,
                        payload: {
                            data: {
                                title: 'Proyecto Actualizado',
                                description: 'Descripción actualizada del proyecto',
                                projectType: 'Desarrollo',
                                itinerary: 'Desarrollo de Software',
                            },
                        },
                    },
                ],
                tutor: [
                    {
                        name: 'Update Comment',
                        url: `/api/comments/${data.ids.comments[0]}`,
                        payload: {
                            data: {
                                correction: 'Test comment updated',
                            },
                        },
                    },
                    {
                        name: 'Update Document Status Revisado',
                        url: `/api/documents/${data.ids.documents[0]}`,
                        payload: {
                            data: {
                                isRevised: true,
                            },
                        },
                    },
                ],
            };

            putEndpoints[rol]?.forEach((endpoint) => {
                const response = http.put(
                    `${BASE_URL}${endpoint.url}`,
                    JSON.stringify(endpoint.payload),
                    { headers }
                );
                responseTime.add(response.timings.duration);
                check(response, {
                    [`${endpoint.name} status 200`]: (r) => r.status === 200,
                }) || requestErrors.add(1);
            });
        });
    }
