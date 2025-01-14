import React from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet
} from "react-router-dom";

import { useAuth, AuthProvider } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";

/* AUTENTICACION */
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

/* ESTUDIANTE */
import StudentsDashboard from "./pages/StudentDashboard";
import ViewProjectsStudents from "./pages/ViewProjectsStudents";
import ProjectDetalle from "./pages/ProyectoDetalle";

/* TUTOR */
import TutorDashboard from "./pages/TutorDashboard";
import ProjectsAsignedTutor from "./pages/ProjectsAsignedTutor";
import DocumentoViewer from "./pages/DocumentViewer";
import { decryptData } from "./utils/encryption";

const NotFound = () => {
  return (
    <div>
      <h1>404</h1>
      <p>Not Found</p>
    </div>
  );
};

/* COMPONENTE RUTAS PROTEGIDAS */
const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>; // O un spinner de carga

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.rol !== requiredRole) {
    return <Navigate to="/" replace />; // Redirige si no tiene el rol adecuado
  }

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute requiredRole="tutor" />}>
          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
          <Route path="/tutor/assigned-projects" element={<ProjectsAsignedTutor />} />
          <Route path="/document/:documentId" element={<DocumentoViewer />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole="estudiante" />}>
          <Route path="/student/dashboard" element={<StudentsDashboard />} />
          <Route path="/student/projects/view" element={<ViewProjectsStudents />} />
          <Route path="/project/:projectId" element={<ProjectDetalle />} />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;