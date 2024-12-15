import React from "react";
import {
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
const ProtectedRoute = () => {

  const encryptedUserData = localStorage.getItem("userData");
  if (!encryptedUserData) {
    console.warn("No se encontraron datos de usuario en localStorage.");
    return;
  }
  const userData = decryptData(encryptedUserData);


  const isAutenticated = () => {
    const email = userData.email;
    return email !== null;
  };

  return isAutenticated() ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  return (
    <>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            {/* Rutas de Tutor */}
            <Route path="/tutor/dashboard" element={<TutorDashboard />} />
            <Route path="/tutor/assigned-projects" element={<ProjectsAsignedTutor />} />
            <Route path="/document/:documentId" element={<DocumentoViewer />} />

            {/* Rutas de Estudiante */}
            <Route path="/student/dashboard" element={<StudentsDashboard />} />
            <Route path="/student/projects/view" element={<ViewProjectsStudents />} />
            
            <Route path="/project/:projectId" element={<ProjectDetalle />} />
          </Route>

          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    </>
  );
}

export default App;