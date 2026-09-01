import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../core/Autentication";
import { successAlert, registerErrorAlert } from "../components/Alerts/Alerts";
import { Info } from "lucide-react";

import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // El rol no se envía: el backend descarta `rols` del registro y asigna
      // siempre estudiante. Antes se elegía desde un select y cualquiera podía
      // registrarse como Superadmin.
      const data = { username, email, password, isInstitutional: false };
      await registerUser(data);
      successAlert("Cuenta creada. Ya puedes iniciar sesión.");

      setUsername("");
      setEmail("");
      setPassword("");
      navigate("/login");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 409) {
          registerErrorAlert("El usuario ya existe.");
        } else if (error.response.status === 400) {
          registerErrorAlert("Error en los datos proporcionados.");
        } else {
          registerErrorAlert(
            "Error al registrar el usuario. Inténtalo de nuevo."
          );
        }
      } else {
        registerErrorAlert(
          "Error al registrar el usuario. Inténtalo de nuevo."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      description="Regístrate para empezar a versionar tus documentos."
      footer={
        <div className="flex flex-col gap-2">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Inicia sesión
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
          id="username"
          label="Nombre de usuario"
          placeholder="nombre de usuario"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <Input
          id="email"
          type="email"
          label="Correo electrónico"
          placeholder="nombre@unl.edu.ec"
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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-2 rounded-lg border border-line bg-surface-2 p-3 text-xs text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" strokeWidth={1.8} />
          <p>
            Al registrarte se te asigna el rol de estudiante. Si necesitas otro
            rol, solicítalo a la coordinación de la carrera.
          </p>
        </div>

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrarme"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default SignUp;
