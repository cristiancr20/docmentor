import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet
} from "react-router-dom";

/* import { AuthProvider, useAuth } from "./context/AuthContext"; */

import Dashboard from "./pages/Dashboard";

/* AUTENTICACION */
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

/* ESTUDIANTE */
import StudentsDashboard from "./pages/StudentDashboard";
import SubirDocumento from "./components/SubirDocumento";
import ViewProjectsStudents from "./pages/ViewProjectsStudents";
import ProjectDetalle from "./pages/ProyectoDetalle";

/* TUTOR */
import TutorDashboard from "./pages/TutorDashboard";
import ProjectsAsignedTutor from "./pages/ProjectsAsignedTutor";
import DocumentoViewer from "./pages/DocumentViewer";

const NotFound = () => {
  return (
    <div>
      <h1>404</h1>
      <p>Not Found</p>
    </div>
  );
};

/* COMPONENTE RUTAS PROTEGIDAS */
const ProtectedRoute = () => {
  const isAutenticated = () => {
    const email = localStorage.getItem("email");
    return email !== null;
  };

  return isAutenticated() ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            {/* Rutas de Tutor */}
            <Route path="/tutor/dashboard" element={<TutorDashboard />} />
            <Route path="/proyectos/asignados" element={<ProjectsAsignedTutor />} />
            <Route path="/documento/:documentId" element={<DocumentoViewer />} />

            {/* Rutas de Estudiante */}
            <Route path="/student/dashboard" element={<StudentsDashboard />} />
            <Route path="/proyecto/ver" element={<ViewProjectsStudents />} />
            <Route path="/subir/documento" element={<SubirDocumento />} />
            <Route path="/proyecto/:projectId" element={<ProjectDetalle />} />
          </Route>

          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;