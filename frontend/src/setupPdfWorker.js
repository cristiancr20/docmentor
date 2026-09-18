import { GlobalWorkerOptions } from 'pdfjs-dist';

// El worker vive en public/pdf.worker.js; Vite lo sirve tal cual bajo BASE_URL
GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.js`;
