import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";


import Login from "./pages/Login";

import StudentsDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/tutor-dashboard" element={<TutorDashboard />} />
          <Route path="/student-dashboard" element={<StudentsDashboard />} />
        </Routes>
      </Router>
    </>
  );
};


export default App;
