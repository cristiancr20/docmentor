import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import exec from 'k6/execution';

// Definición de métricas personalizadas
// Métrica para tiempos de respuesta globales
const responseTime = new Trend('response_time');

// Pre-declare endpoint specific metrics
const listProjectsTime = new Trend('response_time_list_projects');
const listDocumentsTime = new Trend('response_time_list_documents');
const viewDocumentTime = new Trend('response_time_view_document_with_comments');
const viewNotificationsTime = new Trend('response_time_view_notifications');
const createProjectTime = new Trend('response_time_create_project');
const createDocumentTime = new Trend('response_time_create_document');
const addCommentTime = new Trend('response_time_add_comment');
const updateProjectTime = new Trend('response_time_update_project');
const updateCommentTime = new Trend('response_time_update_comment');

// Métricas específicas por método HTTP
const requestDurationByMethod = {
    get: new Trend('request_duration_get'),
    post: new Trend('request_duration_post'),
    put: new Trend('request_duration_put')
};

// Contadores de errores por método
const errorsByMethod = {
    get: new Counter('errors_get'),
    post: new Counter('errors_post'),
    put: new Counter('errors_put')
};

// Métricas adicionales
const successRate = new Rate('success_rate');               // Tasa de éxito global
const dataTransferred = new Trend('data_transferred');      // Datos transferidos
const responseTimeByEndpoint = {
    'list_projects': listProjectsTime,
    'list_documents': listDocumentsTime,
    'view_document_with_comments': viewDocumentTime,
    'view_notifications': viewNotificationsTime,
    'create_project': createProjectTime,
    'create_document': createDocumentTime,
    'add_comment': addCommentTime,
    'update_project': updateProjectTime,
    'update_comment': updateCommentTime
};

// URL base de la API
const BASE_URL = 'https://revisor-documental-production.up.railway.app';

// Configuración de la prueba de carga
export const options = {
    // Definición de etapas de carga
    // Puedes cambiar estos valores según la prueba que quieras ejecutar
    stages: [
        { duration: '1m', target: 10 },  // Inicio muy gradual
        { duration: '2m', target: 20 },  // Carga ligera
        { duration: '3m', target: 50 },  // Pico bajo
        { duration: '1m', target: 20 },  // Reducción
    ],
    
    // Umbrales de rendimiento esperados
    thresholds: {
        // Tiempos de respuesta por tipo de operación
        'request_duration_get': ['p(95)<800', 'p(99)<1500'],    // GET: 95% bajo 800ms, 99% bajo 1.5s
        'request_duration_post': ['p(95)<1200', 'p(99)<2000'],  // POST: más permisivo
        'request_duration_put': ['p(95)<1200', 'p(99)<2000'],   // PUT: similar a POST
        
        // Límites de errores por método
        'errors_get': ['count<5'],      // Máximo 5 errores en GETs
        'errors_post': ['count<10'],    // Máximo 10 errores en POSTs
        'errors_put': ['count<10'],     // Máximo 10 errores en PUTs
        
        // Métricas globales
        'success_rate': ['rate>0.95'],           // 95% de éxito
        'http_reqs': ['rate>50'],                // Mínimo 50 req/s
        'http_req_duration': ['p(95)<1500'],     // 95% bajo 1.5s
        'data_transferred': ['avg>100'],         // Mínimo 100 bytes promedio
    },
};

// Tokens de autenticación para diferentes roles
const sessions = {
    estudiante: {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzM2ODg5MDQ4LCJleHAiOjE3Mzk0ODEwNDh9.Td_WvMeU8FZK8fspQ0RaByQo5abHzxFm2xNSeuY651w',
        rol: 'estudiante',
    },
    tutor: {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzM2ODg5MTA4LCJleHAiOjE3Mzk0ODExMDh9.3lGXMRwejW5S1tqA8I-uhILbdp4J_XiPum4CjlvDzTs',
        rol: 'tutor',
    },
};

// Configuración inicial y validación
export function setup() {
    // Validación de tokens
    if (!sessions.estudiante?.jwt || !sessions.tutor?.jwt) {
        throw new Error('No se encontraron tokens JWT válidos para estudiante y/o tutor');
    }

    // Verificación inicial de la API
    const checkApi = http.get(BASE_URL);
    if (checkApi.status !== 200) {
        throw new Error('El API no está respondiendo correctamente');
    }

    // Retorna la configuración inicial
    return {
        sessions: sessions,
        ids: {
            projects: [2, 3],     // IDs de proyectos para pruebas
            documents: [1, 2],    // IDs de documentos para pruebas
            comments: [1, 2],     // IDs de comentarios para pruebas
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

// Función auxiliar para validar respuestas
function validateResponse(response, endpointName, method) {
    const checks = check(response, {
        'status is 200': (r) => r.status === 200,
        'response is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
        'response has data': (r) => r.json('data') !== null,
    }, { method: method, endpoint: endpointName });

    if (!checks) {
        errorsByMethod[method.toLowerCase()].add(1);
    }

    return checks;
}

// Función principal de prueba
export default function (data) {
    // Alternar entre roles de usuario
    const rol = exec.scenario.iterationInInstance % 2 === 0 ? 'estudiante' : 'tutor';
    const headers = {
        Authorization: `Bearer ${data.sessions[rol].jwt}`,
        'Content-Type': 'application/json',
    };

    // Grupo de pruebas GET
    group('Get Requests', function () {
        data.endpoints.get.forEach((endpoint) => {
            const response = http.get(`${BASE_URL}${endpoint.url}`, { headers });
            
            // Registro de métricas
            requestDurationByMethod.get.add(response.timings.duration);
            responseTime.add(response.timings.duration, { 
                method: 'GET',
                endpoint: endpoint.name 
            });

            // Métricas por endpoint específico
            responseTimeByEndpoint[endpoint.name].add(response.timings.duration);

            // Validación y registro de éxito/error
            validateResponse(response, endpoint.name, 'GET');
            successRate.add(response.status === 200);
            dataTransferred.add(response.body.length);
        });
    });

    sleep(1); // Pausa entre grupos de requests

    // Grupo de pruebas POST
    group('Post Requests', function () {
        const postEndpoints = {
            estudiante: [
                {
                    name: 'Create Project',
                    url: '/api/projects',
                    payload: {
                        data: {
                            title: `Proyecto Test ${Date.now()}`,
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
                            title: `Documento Test ${Date.now()}`,
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
                            correction: `Comentario Test ${Date.now()}`,
                            document: data.ids.documents[0],
                        },
                    },
                },
            ],
        };

        // Ejecutar endpoints POST según el rol
        postEndpoints[rol]?.forEach((endpoint) => {
            const response = http.post(
                `${BASE_URL}${endpoint.url}`,
                JSON.stringify(endpoint.payload),
                { headers }
            );

            // Registro de métricas
            requestDurationByMethod.post.add(response.timings.duration);
            responseTime.add(response.timings.duration, { 
                method: 'POST',
                endpoint: endpoint.name 
            });

            // Validación y registro
            validateResponse(response, endpoint.name, 'POST');
            successRate.add(response.status === 200);
            dataTransferred.add(response.body.length);
        });
    });

    sleep(1); // Pausa entre grupos de requests

    // Grupo de pruebas PUT
    group('Put Requests', function () {
        const putEndpoints = {
            estudiante: [
                {
                    name: 'Update Project',
                    url: `/api/projects/${data.ids.projects[0]}`,
                    payload: {
                        data: {
                            title: `Proyecto Actualizado ${Date.now()}`,
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
                            correction: `Comentario Actualizado ${Date.now()}`,
                        },
                    },
                },
            ],
        };

        // Ejecutar endpoints PUT según el rol
        putEndpoints[rol]?.forEach((endpoint) => {
            const response = http.put(
                `${BASE_URL}${endpoint.url}`,
                JSON.stringify(endpoint.payload),
                { headers }
            );

            // Registro de métricas
            requestDurationByMethod.put.add(response.timings.duration);
            responseTime.add(response.timings.duration, { 
                method: 'PUT',
                endpoint: endpoint.name 
            });

            // Validación y registro
            validateResponse(response, endpoint.name, 'PUT');
            successRate.add(response.status === 200);
            dataTransferred.add(response.body.length);
        });
    });

    // Periodo de descanso entre iteraciones
    sleep(2);
}