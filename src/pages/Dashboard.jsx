// src/pages/Dashboard.jsx
import React from 'react';
import StudentDashboard from './StudentDashboard'; // Asegúrate de que la ruta es correcta
import TutorDashboard from './TutorDashboard'; // Asegúrate de que la ruta es correcta
import { useUser } from '../UserContext';

const Dashboard = () => {
  const { user } = useUser();

  return (
    <div>
      {user.role === 'student' ? <StudentDashboard /> : <TutorDashboard />}
    </div>
  );
};

export default Dashboard;
