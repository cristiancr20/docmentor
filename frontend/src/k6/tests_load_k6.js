import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import exec from 'k6/execution';

// Métricas personalizadas
const responseTime = new Trend('response_time'); // Métrica global de tiempos de respuesta
const requestErrors = new Counter('request_errors'); // Conteo de errores
const successRate = new Rate('success_rate'); // Métrica de tasa de éxito
const responseTimeByEndpoint = {}; // Almacenará tiempos de respuesta por endpoint
const dataTransferred = new Trend('data_transferred'); // Métrica para la cantidad de datos transferidos


const BASE_URL = 'https://revisor-documental-production.up.railway.app';

// Configuración de la prueba


export const options = {
    stages: [
        { duration: '1m', target: 10 }, // Inicio gradual
        { duration: '2m', target: 25 }, // Carga media
        { duration: '5m', target: 100 }, // Carga máxima
        { duration: '2m', target: 25 }, // Reducción gradual
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% de las solicitudes deben tardar menos de 1500 ms
        'response_time': ['p(95)<500'], // Tiempo de respuesta global
        'request_errors': ['count<10'], // No debe haber más de 10 errores
        'success_rate': ['rate>0.95'], // La tasa de éxito debe ser superior al 95%
        'data_transferred': ['avg>100'], // Promedio de datos transferidos debe ser mayor a 100 bytes
        
    },
};

// Tokens JWT para autenticación

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

// Configuración inicial de datos

export function setup() {
    if (!sessions.estudiante?.jwt || !sessions.tutor?.jwt) {
        throw new Error('No se encontraron tokens JWT válidos para estudiante y/o tutor');
    }

    return {
        sessions: sessions,
        ids: {
            projects: [2, 3], // IDs de proyectos
            documents: [1, 2], // IDs de documentos
            comments: [1, 2], // IDs de comentarios
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



// Escenario principal
export default function (data) {
    const rol = exec.scenario.iterationInInstance % 2 === 0 ? 'estudiante' : 'tutor'; // Alternar roles

    const headers = {
        Authorization: `Bearer ${data.sessions[rol].jwt}`,
        'Content-Type': 'application/json',
    };


    // GET Requests
    group('Get Requests', function () {
        data.endpoints.get.forEach((endpoint) => {
            const response = http.get(`${BASE_URL}${endpoint.url}`, { headers });

            // Métrica: Tiempo de respuesta global y por endpoint
            responseTime.add(response.timings.duration);
            if (!responseTimeByEndpoint[endpoint.name]) {
                responseTimeByEndpoint[endpoint.name] = new Trend(`response_time_${endpoint.name}`);
            }
            responseTimeByEndpoint[endpoint.name].add(response.timings.duration);

            // Métrica: Tasa de éxito
            const success = response.status === 200;
            successRate.add(success);

            // Validación y conteo de errores
            check(response, {
                [`${endpoint.name} status 200`]: () => success,
            }) || requestErrors.add(1);

            // Métrica: Transferencia de datos
            dataTransferred.add(response.body.length);
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

            // Registrar métricas y validaciones
            responseTime.add(response.timings.duration);
            successRate.add(response.status === 200);
            dataTransferred.add(response.body.length);
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

            // Registrar métricas y validaciones
            responseTime.add(response.timings.duration);
            successRate.add(response.status === 200);
            dataTransferred.add(response.body.length);
        });
    });
}
