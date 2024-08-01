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
import ListarDocumentos from "./pages/ListarDocumentos";
import SubirDocumento from "./pages/SubirDocumento";

/* TUTOR */
import TutorDashboard from "./pages/TutorDashboard";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/tutor-dashboard" element={<TutorDashboard />} />
          <Route path="/student-dashboard" element={<StudentsDashboard />} />
          <Route path="/documentos" element={<ListarDocumentos />} />

          <Route path="/subir/documento" element={<SubirDocumento />} />
        </Routes>
      </Router>
    </>
  );
};


export default App;
