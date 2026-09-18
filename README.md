# DocMentor - Sistema de Gestión de Documentos

DocMentor es una aplicación web para la gestión y seguimiento de documentos de proyectos académicos, permitiendo la interacción entre tutores y estudiantes.

## 🚀 Características Principales

- Gestión de proyectos académicos
- Roles de usuario (Estudiante, Tutor, Administrador)
- Gestión de documentos y versiones
- Interfaz responsiva y moderna
- Sistema de autenticación seguro

## 🛠️ Tecnologías Utilizadas

### Frontend
- React 18.x + Vite
- React Router 6.x
- Tailwind CSS 3.x
- Framer Motion
- Axios
- SweetAlert2
- Lucide React (Iconos)

### Backend
- Node.js
- Express.js
- Strapi CMS
- PostgreSQL
- JWT para autenticación

## 📋 Prerrequisitos

- Node.js (v16.x o superior)
- npm (v8.x o superior)
- PostgreSQL (v13.x o superior)
- Git

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/docmentor.git
cd docmentor
```

2. Instalar dependencias del frontend:
```bash
cd frontend
npm install
```

3. Instalar dependencias del backend:
```bash
cd ../backend
npm install
```

4. Configurar variables de entorno:
   - En el directorio `frontend`, copiar `.env.example` a `.env` y ajustar la URL del backend si no corre en local:
   ```bash
   cp .env.example .env
   ```
   El archivo define `VITE_API_URL=http://localhost:1337` (Vite solo expone al navegador las variables con prefijo `VITE_`). Si no existe `.env`, el frontend usa ese mismo valor por defecto.

   - En el directorio `backend`, crear un archivo `.env`:
   ```
   HOST=0.0.0.0
   PORT=1337
   APP_KEYS=your-app-keys
   API_TOKEN_SALT=your-token-salt
   ADMIN_JWT_SECRET=your-admin-jwt-secret
   JWT_SECRET=your-jwt-secret
   DATABASE_CLIENT=postgres
   DATABASE_HOST=127.0.0.1
   DATABASE_PORT=5432
   DATABASE_NAME=docmentor
   DATABASE_USERNAME=your-username
   DATABASE_PASSWORD=your-password
   ```

5. Configurar la base de datos:
   - Crear una base de datos PostgreSQL llamada `docmentor`
   - Asegurarse de que las credenciales en el archivo `.env` coincidan con tu configuración

## 🚀 Ejecución

1. Iniciar el backend (desde el directorio `backend`):
```bash
npm run develop
```

2. Iniciar el frontend con el servidor de desarrollo de Vite (desde el directorio `frontend`):
```bash
npm start
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend: http://localhost:1337

## 👥 Roles de Usuario

### Estudiante
- Crear y gestionar proyectos
- Subir documentos
- Ver notificaciones de sus proyectos

### Tutor
- Revisar proyectos asignados
- Comentar y aprobar documentos
- Recibir notificaciones de nuevos documentos

### Administrador
- Gestionar usuarios
- Asignar tutores
- Supervisar todos los proyectos

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación. Los tokens se almacenan de forma segura en el localStorage del navegador y se encriptan antes de guardarse.

## 📱 Características de la UI

- Diseño responsivo
- Modo oscuro/claro
- Animaciones suaves
- Interfaz intuitiva y moderna

## 🐛 Depuración

Para depurar la aplicación:

1. Frontend (el build de Vite se genera en `frontend/dist`; `npm run preview` lo sirve en local para probarlo):
```bash
cd frontend
npm run build
npm run preview
```

2. Backend:
```bash
cd backend
npm run strapi build
```

## 📦 Estructura del Proyecto

```
docmentor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── core/
│   │   ├── context/
│   │   └── utils/
│   └── public/
└── backend/
    ├── config/
    ├── src/
    └── api/
```

## ✨ Agradecimientos

- Universidad Nacional de Loja
- Equipo de desarrollo
- Contribuidores
