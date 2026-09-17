import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginSuccessAlert,
  loginErrorAlert,
} from "../components/Alerts/Alerts";

import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { ROLE_ROUTES } from "../utils/auth.utils";
import { useAuth } from "../context/AuthContext";
import { syncUserWithStrapi } from "../core/Autentication";

const LoginInstitucional = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { loginInstitutional } = useAuth();

  const handleAerobaseLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Obtener datos del usuario
      const userData = await loginInstitutional(email, password);

      // Sincronizar con Strapi
      await handleVerifyUser(userData.token);

      // Mostrar alerta de éxito
      loginSuccessAlert(userData.name);

      // Procesar roles y redirigir
      const userRoles = Array.isArray(userData.rols)
        ? userData.rols
        : [userData.rols];

      const priorityRole = userRoles.includes("superadmin")
        ? "superadmin"
        : userRoles.includes("tutor")
          ? "tutor"
          : "estudiante";

      setTimeout(() => {
        navigate(ROLE_ROUTES[priorityRole], { replace: true });
      }, 500);

      // Forzar la redirección
      navigate(ROLE_ROUTES[priorityRole], { replace: true });
    } catch (error) {
      console.error("Error en login de Aerobase:", error);
      loginErrorAlert(
        error.message || "Error en el inicio de sesión institucional"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyUser = async (token) => {
    try {
      const user = await syncUserWithStrapi(token);
      return user;
    } catch (err) {
      console.error("Error:", err);
      throw err; // Propagar el error
    }
  };

  return (
    <AuthLayout
      title="Inicio de sesión institucional"
      description="Usa tu cuenta de la Universidad Nacional de Loja."
      footer={
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-muted transition-colors hover:text-content"
        >
          Volver a la página principal
        </button>
      }
    >
      <form onSubmit={handleAerobaseLogin} className="flex flex-col gap-4">
        <Input
          id="email-institucional"
          type="email"
          label="Correo institucional"
          placeholder="nombre@unl.edu.ec"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          id="password-institucional"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-2">
          {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión institucional"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginInstitucional;
