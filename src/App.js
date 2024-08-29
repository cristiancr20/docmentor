import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";


/* AUTENTICACION */
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

/* ESTUDIANTE */
import StudentsDashboard from "./pages/StudentDashboard";
import SubirDocumento from "./components/SubirDocumento";
import NewProject from "./pages/NewProject";
import ViewProjectsStudents from "./pages/ViewProjectsStudents";
import ProjectDetalle from "./pages/ProyectoDetalle";

/* TUTOR */
import TutorDashboard from "./pages/TutorDashboard";
import ProjectsAsignedTutor from "./pages/ProjectsAsignedTutor";
import DocumentoViewer from "./pages/DocumentViewer";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
          <Route path="/proyectos/asignados" element={<ProjectsAsignedTutor />} />
          <Route path="/documento/:documentId" element={<DocumentoViewer />} />


          <Route path="/student/dashboard" element={<StudentsDashboard />} />
          <Route path="/proyecto/nuevo" element={<NewProject />} />
          <Route path="/proyecto/ver" element={<ViewProjectsStudents />} />
          <Route path="/subir/documento" element={<SubirDocumento />} />
          <Route path="/proyecto/:projectId" element={<ProjectDetalle/>} />
        </Routes>
      </Router>
    </>
  );
};


export default App;
