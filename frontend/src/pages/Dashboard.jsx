import React from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  ArrowRight,
  FileText,
  GitCompareArrows,
  History,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";

import ThemeToggle from "../components/ui/ThemeToggle";

const FEATURES = [
  {
    icon: History,
    title: "Historial de versiones",
    description:
      "Cada entrega queda registrada. Recupera cualquier versión anterior sin perder el rastro del avance.",
  },
  {
    icon: GitCompareArrows,
    title: "Comparación de documentos",
    description:
      "Contrasta dos versiones y detecta qué cambió entre una revisión y la siguiente.",
  },
  {
    icon: MessagesSquare,
    title: "Revisión con el tutor",
    description:
      "Observaciones y correcciones en el mismo lugar donde vive el documento.",
  },
  {
    icon: ShieldCheck,
    title: "Auditoría",
    description:
      "Quién hizo qué y cuándo, con reportes exportables para la coordinación.",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 hero-glow" aria-hidden="true" />

      <header className="relative">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-on-accent">
              <FileText className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="font-display text-xl font-bold text-content">DocMentor</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto max-w-content px-6 pb-20 pt-12 md:pt-20">
        <section className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
            Versionado documental para tesis y proyectos
          </span>

          <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-content md:text-5xl">
            Bienvenido a DocMentor
          </h1>

          <p className="mt-4 text-sm text-muted md:text-base">
            DocMentor es el sistema de versionado documental que transforma la
            forma en que gestionas tus documentos. Con un enfoque en la
            colaboración entre estudiantes y tutores, DocMentor te permite
            rastrear, revisar y mejorar documentos de manera eficiente.
          </p>

          <LoginOptions navigate={navigate} />
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-xl border border-line bg-surface p-6 shadow-card transition-colors hover:border-line-strong"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-wash text-accent">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-content">{title}</h2>
              <p className="mt-1 text-sm text-muted">{description}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="relative border-t border-line">
        <div className="mx-auto max-w-content px-6 py-6 text-xs text-muted">
          DocMentor · Universidad Nacional de Loja
        </div>
      </footer>
    </div>
  );
};

const LoginOptions = ({ navigate }) => (
  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
    <button
      type="button"
      onClick={() => navigate("/login")}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-medium text-on-accent transition-colors hover:bg-accent-soft"
    >
      Iniciar sesión
      <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
    </button>
    <button
      type="button"
      onClick={() => navigate("/sign-up")}
      className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface-2 px-6 text-sm font-medium text-content transition-colors hover:border-line-strong"
    >
      Registrarse
    </button>
  </div>
);

LoginOptions.propTypes = {
  navigate: PropTypes.func,
};

export default Dashboard;
