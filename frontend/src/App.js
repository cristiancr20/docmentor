import React from "react";
import PropTypes from "prop-types";
import {
  Routes,
  Route,
  Navigate,
  Outlet
} from "react-router-dom";

import { useAuth, AuthProvider } from "./context/AuthContext";
import { PermissionProvider } from "./context/PermissionContext";

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

/* COORDINATOR */
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import AuditLogs from "./pages/AuditLogs";


/* COMPONENTE RUTAS PROTEGIDAS */
const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>; // O un spinner de carga

  if (!user) return <Navigate to="/login" replace />;

  // Se comprueba el rol fallando cerrado: si el usuario no trae roles, se
  // deniega. Antes la condición era `requiredRole && user.rols`, así que un
  // usuario sin `rols` se saltaba la verificación y entraba a cualquier panel.
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRoles = user.rols ?? (user.rol ? [user.rol] : []);
    if (!userRoles.some((role) => requiredRoles.includes(role))) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

ProtectedRoute.propTypes = {
  requiredRole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
};


function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-institucional" element={<LoginInstitucional />} />
          <Route path="/sign-up" element={<SignUp />} />

          {/* Rutas protegidas */}
          {/* Detalle de proyecto y documento: cualquier usuario con sesión.
              Estaban fuera del bloque protegido, así que con IDs correlativos
              se podían enumerar proyectos y documentos ajenos sin iniciar sesión. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/document/:documentId" element={<DocumentoViewer />} />
            <Route path="/project/:projectId" element={<ProjectDetalle />} />
          </Route>

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

          {/* ROL COORDINADOR */}
          <Route element={<ProtectedRoute requiredRole="coordinador" />}>
            <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;