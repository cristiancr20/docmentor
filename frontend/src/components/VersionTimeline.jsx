import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ChevronRight, History, RotateCcw } from "lucide-react";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import Button from "./ui/Button";
import { formatDateTime } from "../utils/format";

/**
 * Envoltorio de la tarjeta: enlace si la versión tiene archivo, y un simple
 * bloque si no, para no ofrecer un destino que no existe.
 */
const CardShell = ({ to, isCurrent, children }) => {
  const className = [
    "group block rounded-xl border p-3 transition-colors",
    // La versión actual se destaca con el acento: es la que importa a diario.
    isCurrent ? "border-accent bg-accent-wash" : "border-line bg-surface",
    to ? "hover:border-line-strong" : "",
  ].join(" ");

  if (!to) return <div className={className}>{children}</div>;

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
};

CardShell.propTypes = {
  to: PropTypes.string,
  isCurrent: PropTypes.bool,
  children: PropTypes.node,
};

/**
 * Historial de versiones como línea de tiempo.
 *
 * Además del hilo vertical que une las versiones consecutivas, dibuja un arco
 * desde la versión restaurada hasta aquella de la que salió. Es la única
 * relación del historial que no es secuencial, y sin representarla no había
 * forma de saber de dónde venía una restauración.
 */
const VersionTimeline = ({ documents, canRestore, onRestore, restoringId }) => {
  const containerRef = useRef(null);
  const rowRefs = useRef({});
  const [arcs, setArcs] = useState([]);

  // Los arcos se calculan a partir de la posición real de las filas, así que
  // hay que rehacerlos cuando cambian el tamaño o la lista.
  const measureArcs = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerBox = container.getBoundingClientRect();

    const next = documents
      .map((doc) => {
        const sourceId = doc.attributes.restoredFrom?.data?.id;
        if (!sourceId) return null;

        const target = rowRefs.current[doc.id];
        const source = rowRefs.current[sourceId];
        if (!target || !source) return null;

        const targetBox = target.getBoundingClientRect();
        const sourceBox = source.getBoundingClientRect();

        return {
          id: doc.id,
          fromY: sourceBox.top - containerBox.top + sourceBox.height / 2,
          toY: targetBox.top - containerBox.top + targetBox.height / 2,
          label: `v${doc.attributes.restoredFrom.data.attributes?.version ?? "?"}`,
        };
      })
      .filter(Boolean);

    setArcs(next);
  }, [documents]);

  useLayoutEffect(() => {
    measureArcs();

    const observer = new ResizeObserver(measureArcs);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [measureArcs]);

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sin versiones"
        description="Cuando se suba un documento aparecerá aquí el historial de versiones."
      />
    );
  }

  return (
    <div ref={containerRef} className="relative pl-10">
      {/* Carril del arco: va por fuera del hilo principal para no cruzarse
          con los puntos de cada versión. */}
      <svg
        className="pointer-events-none absolute left-0 top-0 h-full w-10 overflow-visible"
        aria-hidden="true"
      >
        {arcs.map((arc) => (
          <g key={arc.id}>
            <path
              d={`M 22 ${arc.fromY} C 2 ${arc.fromY}, 2 ${arc.toY}, 22 ${arc.toY}`}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <circle cx="22" cy={arc.toY} r="3" fill="var(--accent)" />
          </g>
        ))}
      </svg>

      <ol className="flex flex-col">
        {documents.map((doc, index) => {
          const { title, version, isCurrent, isRevised, publishedAt, documentFile, restoredFrom } =
            doc.attributes;

          const hasFile = documentFile?.data?.length > 0;
          const sourceVersion = restoredFrom?.data?.attributes?.version;
          const isLast = index === documents.length - 1;

          return (
            <li
              key={doc.id}
              ref={(element) => {
                rowRefs.current[doc.id] = element;
              }}
              className="relative pb-4 pl-6"
            >
              {/* Hilo vertical entre versiones consecutivas. */}
              {!isLast && (
                <span className="absolute left-[5px] top-5 h-full w-px bg-line" aria-hidden="true" />
              )}
              <span
                className={`absolute left-0 top-3 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
                  isCurrent ? "bg-accent" : "bg-line-strong"
                }`}
                aria-hidden="true"
              />

              {/* La tarjeta entera abre el documento: el botón "Ver documento"
                  duplicaba una acción que ya sugiere el propio bloque. */}
              <CardShell to={hasFile ? `/document/${doc.id}` : null} isCurrent={isCurrent}>
                <div className="flex items-start gap-3">
                  {/* Identificador de versión: era texto pequeño perdido junto
                      al título y no se distinguía de un vistazo cuál era cuál. */}
                  <span
                    className={`grid h-10 w-12 shrink-0 place-items-center rounded-lg font-display text-sm font-bold tabular ${
                      isCurrent
                        ? "bg-accent text-on-accent"
                        : "bg-surface-2 text-muted"
                    }`}
                  >
                    v{version}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate font-medium text-content">{title}</span>
                      {isCurrent && <Badge tone="accent">Versión actual</Badge>}
                      <Badge tone={isRevised ? "ok" : "warn"}>
                        {isRevised ? "Revisado" : "Pendiente"}
                      </Badge>
                      {sourceVersion != null && (
                        <Badge tone="neutral">
                          <RotateCcw className="mr-1 inline h-3 w-3" strokeWidth={2} />
                          Restaurada desde v{sourceVersion}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 font-mono text-xs text-muted">
                      {formatDateTime(publishedAt)}
                      {!hasFile && " · sin archivo adjunto"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {/* Restaurar la versión que ya es la actual no tendría efecto. */}
                    {canRestore && hasFile && !isCurrent && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={restoringId === doc.id}
                        onClick={(event) => {
                          // La tarjeta navega al documento: sin esto, restaurar
                          // abriría además el detalle.
                          event.preventDefault();
                          event.stopPropagation();
                          onRestore(doc);
                        }}
                      >
                        <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
                        Restaurar
                      </Button>
                    )}

                    {hasFile && (
                      <ChevronRight
                        className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5"
                        strokeWidth={1.8}
                      />
                    )}
                  </div>
                </div>
              </CardShell>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

VersionTimeline.propTypes = {
  documents: PropTypes.array.isRequired,
  canRestore: PropTypes.bool,
  onRestore: PropTypes.func.isRequired,
  restoringId: PropTypes.number,
};

export default VersionTimeline;
