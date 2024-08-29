import { GlobalWorkerOptions } from 'pdfjs-dist';

// Configura la ruta al worker
GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.js`;
