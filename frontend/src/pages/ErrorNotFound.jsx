import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

function ErrorNotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 hero-glow" aria-hidden="true" />

      <div className="relative flex max-w-md flex-col items-center text-center animate-fade-up">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-surface text-accent shadow-card">
          <Compass className="h-6 w-6" strokeWidth={1.8} />
        </div>

        <p className="mt-6 font-mono text-sm tabular text-muted">Error 404</p>
        <h1 className="mt-2 font-display text-5xl font-bold tabular text-content md:text-6xl">
          404
        </h1>
        <p className="mt-3 text-sm text-muted">
          La página que buscas no existe o fue movida.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-medium text-on-accent transition-colors hover:bg-accent-soft"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default ErrorNotFound;
