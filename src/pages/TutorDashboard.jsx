import React from 'react'
import Navbar from '../components/Navbar'

function TutorDashboard() {

  const username = localStorage.getItem("username");

  return (
    <div className="Tutor">
      <Navbar/>
      <section class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-3xl font-bold text-gray-900">Bienvenido, {username}</h2>
            <p class="mt-4 text-lg text-gray-600">Gestiona y revisa los documentos de tus estudiantes, agrega comentarios y mantén un seguimiento de todas las versiones en un solo lugar.</p>
        </div>
    </section>


    </div>
  )
}

export default TutorDashboard