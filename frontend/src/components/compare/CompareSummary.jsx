import React from "react";
import PropTypes from "prop-types";

/**
 * Resumen del resultado de la comparación.
 *
 * La similitud es el porcentaje de palabras que se mantienen entre las dos
 * versiones, así que da de un vistazo si el cambio fue un retoque o una
 * reescritura.
 */
const CompareSummary = ({ summary, activeFilter, onFilterChange }) => {
  const filters = [
    { key: "all", label: "Todos", count: summary.added + summary.removed + summary.modified },
    { key: "modified", label: "Modificados", count: summary.modified, tone: "warn" },
    { key: "added", label: "Agregados", count: summary.added, tone: "ok" },
    { key: "removed", label: "Eliminados", count: summary.removed, tone: "danger" },
  ];

  const similarityTone =
    summary.similarity >= 90 ? "text-ok" : summary.similarity >= 60 ? "text-warn" : "text-danger";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-baseline gap-2">
        <span className={`font-display text-2xl font-bold tabular ${similarityTone}`}>
          {summary.similarity}%
        </span>
        <span className="text-sm text-muted">de contenido en común</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onFilterChange(filter.key)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-accent text-on-accent"
                  : "bg-surface text-muted hover:text-content",
              ].join(" ")}
            >
              {filter.label}
              <span className="ml-1.5 tabular">{filter.count}</span>
            </button>
          );
        })}
      </div>

      <p className="font-mono text-xs text-muted">
        {summary.wordsBefore} → {summary.wordsAfter} palabras
      </p>
    </div>
  );
};

CompareSummary.propTypes = {
  summary: PropTypes.shape({
    added: PropTypes.number,
    removed: PropTypes.number,
    modified: PropTypes.number,
    similarity: PropTypes.number,
    wordsBefore: PropTypes.number,
    wordsAfter: PropTypes.number,
  }).isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default CompareSummary;
