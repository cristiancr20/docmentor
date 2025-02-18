import React from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet
} from "react-router-dom";

import { useAuth, AuthProvider } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/ErrorNotFound";

/* AUTENTICACION */
import Login from "./pages/Login";
import LoginInstitucional from "./pages/LoginInstitucional";
import SignUp from "./pages/SignUp";

/* ESTUDIANTE */
import StudentsDashboard from "./pages/StudentDashboard";
import ViewProjectsStudents from "./pages/ViewProjectsStudents";
import ProjectDetalle from "./pages/ProyectoDetalle";

/* TUTOR */
import TutorDashboard from "./pages/TutorDashboard";
import ProjectsAsignedTutor from "./pages/ProjectsAsignedTutor";
import DocumentoViewer from "./pages/DocumentViewer";

/* ADMIN */
import AdminDashboard from "./pages/Administration";


/* COMPONENTE RUTAS PROTEGIDAS */
const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>; // O un spinner de carga

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && !user.rol.some(role => requiredRole.includes(role))) {
    return <Navigate to="/" replace />;
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
        <Route path="/login-institucional" element={<LoginInstitucional />} />
        <Route path="/sign-up" element={<SignUp />} />
        {/* ROL TUTOR-ESTUDIANTE */}
        <Route path="/document/:documentId" element={<DocumentoViewer />} />
        <Route path="/project/:projectId" element={<ProjectDetalle />} />


        {/* Rutas protegidas */}
        {/* ROL TUTOR y SUPERADMIN */}
        <Route element={<ProtectedRoute requiredRole={["superadmin","tutor"]} />}>
          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
          <Route path="/tutor/projects/view" element={<ProjectsAsignedTutor />} />
        </Route>
        {/* ROL ESTUIANE*/}
        <Route element={<ProtectedRoute requiredRole="estudiante" />}>
          <Route path="/student/dashboard" element={<StudentsDashboard />} />
          <Route path="/student/projects/view" element={<ViewProjectsStudents />} />
        </Route>

        {/* ROL SUPERADMIN */}
        <Route element={<ProtectedRoute requiredRole="superadmin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>


        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;