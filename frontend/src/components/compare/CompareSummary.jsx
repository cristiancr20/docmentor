import React from "react";
import PropTypes from "prop-types";

/**
 * Resumen del resultado de la comparación.
 *
 * La similitud es el porcentaje de palabras que se mantienen entre las dos
 * versiones, así que da de un vistazo si el cambio fue un retoque o una
 * reescritura.
 */
const similarityTone = (similarity) =>
  similarity >= 90 ? "text-ok" : similarity >= 60 ? "text-warn" : "text-danger";

/**
 * Indicador de similitud. Vive junto a las pestañas para que siga a la vista
 * también en la comparación lado a lado: es el dato que resume de un vistazo si
 * el cambio fue un retoque o una reescritura.
 */
export const SimilarityBadge = ({ summary }) => (
  <div className="flex items-baseline gap-2 whitespace-nowrap">
    <span className={`font-display text-lg font-bold tabular ${similarityTone(summary.similarity)}`}>
      {summary.similarity}%
    </span>
    <span className="hidden text-xs text-muted sm:inline">de contenido en común</span>
  </div>
);

SimilarityBadge.propTypes = {
  summary: PropTypes.shape({ similarity: PropTypes.number }).isRequired,
};

const CompareSummary = ({ summary, activeFilter, onFilterChange }) => {
  const filters = [
    { key: "all", label: "Todos", count: summary.added + summary.removed + summary.modified },
    { key: "modified", label: "Modificados", count: summary.modified },
    { key: "added", label: "Agregados", count: summary.added },
    { key: "removed", label: "Eliminados", count: summary.removed },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 p-3">
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
