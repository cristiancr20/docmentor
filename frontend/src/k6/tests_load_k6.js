import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import exec from 'k6/execution';

const responseTime = new Trend('response_time');
const requestErrors = new Counter('request_errors');
const successRate = new Rate('success_rate');
const dataTransferred = new Trend('data_transferred');

const responseTimeByEndpoint = {};

const endpoints = [
    //GET
    'List Projects',
    'List Documents',
    'View Document with Comments',
    'View Notifications',
    //POST
    'Create Project',
    'Create Document',
    'Add Comment',
    //PUT
    'Update Project',
    'Update Comment',

];

endpoints.forEach(endpoint => {
    const metricName = endpoint.replace(/\s+/g, '_');
    responseTimeByEndpoint[endpoint] = new Trend(`response_time_${metricName}`);
});

const BASE_URL = 'https://revisor-documental-production.up.railway.app';

export const options = {
    // TEST 1
    /* stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 25 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 25 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        'response_time': ['p(95)<500'],
        'request_errors': ['count<10'],
        'success_rate': ['rate>0.95'],
        'data_transferred': ['avg>100'],
    }, */
    // TEST 2
    /* stages: [
        { duration: '1m', target: 25 },
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 25 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        'response_time': ['p(95)<1000'],
        'request_errors': ['count<20'],
        'success_rate': ['rate>0.95'],
        'data_transferred': ['avg>100'],
    }, */
    // TEST 3
    /* stages: [
        { duration: '1m', target: 25 },
        { duration: '2m', target: 60 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 15 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'],
        'response_time': ['p(95)<1500'],
        'request_errors': ['count<30'],
        'success_rate': ['rate>0.95'],
        'data_transferred': ['avg>100'],
    }, */

    // TEST 4
    stages: [
        { duration: '1m', target: 30 },
        { duration: '2m', target: 70 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 35 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        'response_time': ['p(95)<2000'],
        'request_errors': ['count<30'],
        'success_rate': ['rate>0.95'],
        'data_transferred': ['avg>100'],
    },
};

const sessions = {
    estudiante: {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzM3MTMyMzgwLCJleHAiOjE3Mzk3MjQzODB9.pdZvGVTMa-FvsS5zB3u89ntFNe_LUpbS7fDMjEkbkKg',
        rol: 'estudiante',
    },
    tutor: {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzM3MTMyMjY3LCJleHAiOjE3Mzk3MjQyNjd9.-PM6qwY7nOJcp4Z-R0CRR1Ero-9M8GUNSLf0CNvsF1I',
        rol: 'tutor',
    },
};

export function setup() {
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
            ],
        },
    };
}

export default function (data) {
    const rol = exec.scenario.iterationInInstance % 2 === 0 ? 'estudiante' : 'tutor';
    const headers = {
        Authorization: `Bearer ${data.sessions[rol].jwt}`,
        'Content-Type': 'application/json',
    };

    group('Get Requests', function () {
        data.endpoints.get.forEach((endpoint) => {
            const response = http.get(`${BASE_URL}${endpoint.url}`, { headers });

            responseTime.add(response.timings.duration);
            responseTimeByEndpoint[endpoint.name].add(response.timings.duration);

            const success = response.status === 200;
            successRate.add(success);

            check(response, {
                [`${endpoint.name} status 200`]: () => success,
            }) || requestErrors.add(1);

            dataTransferred.add(response.body.length);
        });
    });

    sleep(1);

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
            successRate.add(response.status === 200);
            dataTransferred.add(response.body.length);

            check(response, {
                [`${endpoint.name} status 200`]: () => response.status === 200,
            }) || requestErrors.add(1);
        });
    });

    sleep(1);

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
                            correction: 'Comentario actualizado',
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
            successRate.add(response.status === 200);
            dataTransferred.add(response.body.length);

            check(response, {
                [`${endpoint.name} status 200`]: () => response.status === 200,
            }) || requestErrors.add(1);
        });
    });
}
