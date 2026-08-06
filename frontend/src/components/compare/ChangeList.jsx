import React from "react";
import PropTypes from "prop-types";
import { FilePlus2, FileMinus2, FilePen } from "lucide-react";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";

const TYPE_META = {
  added: { label: "Agregado", tone: "ok", icon: FilePlus2 },
  removed: { label: "Eliminado", tone: "danger", icon: FileMinus2 },
  modified: { label: "Modificado", tone: "warn", icon: FilePen },
};

/** Resalta a nivel de palabra qué se quitó y qué se puso dentro de un bloque. */
const InlineWordDiff = ({ parts }) => (
  <p className="whitespace-pre-wrap text-sm leading-relaxed text-content">
    {parts.map((part, index) => {
      if (part.added) {
        return (
          <mark key={index} className="rounded bg-ok-wash px-0.5 text-ok">
            {part.value}
          </mark>
        );
      }

      if (part.removed) {
        return (
          <mark key={index} className="rounded bg-danger-wash px-0.5 text-danger line-through">
            {part.value}
          </mark>
        );
      }

      return <span key={index}>{part.value}</span>;
    })}
  </p>
);

InlineWordDiff.propTypes = {
  parts: PropTypes.array.isRequired,
};

/**
 * Línea intacta que rodea al cambio. Se muestra atenuada y recortada: sin ella
 * un fragmento suelto parece una línea completa del documento, cuando casi
 * siempre es un trozo de un párrafo más largo.
 */
const ContextLine = ({ text, position }) => {
  if (!text) return null;

  const trimmed =
    position === "before" && text.length > 120
      ? `…${text.slice(-120)}`
      : text.length > 120
        ? `${text.slice(0, 120)}…`
        : text;

  return (
    <p className="truncate px-3 text-xs italic leading-relaxed text-muted" title={text}>
      {trimmed}
    </p>
  );
};

ContextLine.propTypes = {
  text: PropTypes.string,
  position: PropTypes.oneOf(["before", "after"]),
};

const ChangeCard = ({ hunk, onGoToPage }) => {
  const meta = TYPE_META[hunk.type];
  const Icon = meta.icon;

  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={meta.tone}>
          <Icon className="mr-1 inline h-3 w-3" strokeWidth={2} />
          {meta.label}
        </Badge>

        {hunk.section && (
          <span className="truncate text-xs font-medium text-content" title={hunk.section}>
            {hunk.section}
          </span>
        )}

        {hunk.page != null && (
          <button
            type="button"
            onClick={() => onGoToPage?.(hunk.page)}
            className="ml-auto shrink-0 font-mono text-xs text-muted underline-offset-2 transition-colors hover:text-accent hover:underline"
          >
            página {hunk.page}
          </button>
        )}
      </header>

      <div className="flex flex-col gap-1">
        <ContextLine text={hunk.contextBefore} position="before" />

        {hunk.type === "modified" ? (
          <div className="rounded-lg bg-surface-2 p-3">
            <InlineWordDiff parts={hunk.wordDiff} />
          </div>
        ) : (
          <p
            className={`whitespace-pre-wrap rounded-lg p-3 text-sm leading-relaxed ${
              hunk.type === "added" ? "bg-ok-wash text-content" : "bg-danger-wash text-content"
            }`}
          >
            {hunk.type === "added" ? hunk.after : hunk.before}
          </p>
        )}

        <ContextLine text={hunk.contextAfter} position="after" />
      </div>
    </article>
  );
};

ChangeCard.propTypes = {
  hunk: PropTypes.object.isRequired,
  onGoToPage: PropTypes.func,
};

const ChangeList = ({ hunks, onGoToPage }) => {
  if (hunks.length === 0) {
    return (
      <EmptyState
        icon={FilePen}
        title="Sin cambios en esta categoría"
        description="Prueba con otro filtro para ver el resto de diferencias."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hunks.map((hunk, index) => (
        <ChangeCard key={index} hunk={hunk} onGoToPage={onGoToPage} />
      ))}
    </div>
  );
};

ChangeList.propTypes = {
  hunks: PropTypes.array.isRequired,
  onGoToPage: PropTypes.func,
};

export default ChangeList;
