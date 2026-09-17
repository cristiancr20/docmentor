import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserWithRole, login as loginServer } from "../core/Autentication";
import {
  loginSuccessAlert,
  loginErrorAlert,
} from "../components/Alerts/Alerts";

import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { ROLE_ROUTES, validateAuthResponse } from "../utils/auth.utils";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Intento de login o registro
      const authResponse = await loginServer({
        identifier: email,
        password: password,
      });

      // Validar la respuesta
      validateAuthResponse(authResponse);

      // Extraer datos y guardar JWT
      const { jwt, user } = authResponse;

      // Obtener rol del usuario
      const userWithRole = await getUserWithRole(user.id, jwt);
      const userRole = userWithRole.rols?.[0]?.rolType;

      if (!userRole) {
        throw new Error("No se pudo obtener el rol del usuario");
      }

      // Crear el objeto con los datos completos del usuario
      const userData = {
        ...user,
        rol: userRole,
        // Estaba escrito `isInstutional`, así que `user.isInstitutional`
        // quedaba undefined y el filtro de tutores no encontraba a nadie.
        isInstitutional: false,
      };

      // 3. Llamar al método `login` del contexto
      login(userData, jwt); // Encripta y guarda los datos globalmente

      // 4. Mostrar mensaje de éxito
      loginSuccessAlert(user.username);

      // 5. Redirigir según el rol
      const route = ROLE_ROUTES[userRole];
      if (route) {
        navigate(route);
      } else {
        throw new Error(`Rol desconocido: ${userRole}`);
      }
    } catch (error) {
      console.error("Error en el proceso de autenticación:", error);
      loginErrorAlert("Error en el inicio de sesión. Verifica tus credenciales.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Iniciar sesión"
      description="Accede con tu cuenta de DocMentor."
      footer={
        <div className="flex flex-col gap-2">
          <p>
            ¿No tienes cuenta?{" "}
            <Link to="/sign-up" className="font-medium text-accent hover:underline">
              Regístrate
            </Link>
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-muted transition-colors hover:text-content"
          >
            Volver a la página principal
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label="Correo electrónico"
          placeholder="nombre@gmail.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          id="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-2">
          {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
