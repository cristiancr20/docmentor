import React from "react";
import PropTypes from "prop-types";

/**
 * Píldora de estado: fondo lavado + texto en el color pleno.
 *
 * Los estados de proyecto y documento del backend se mapean aquí, en un solo
 * sitio. Antes cada dashboard tenía su propia copia de `getStatusColor`, con
 * criterios que ya habían empezado a divergir.
 */

const TONES = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-wash text-accent",
  ok: "bg-ok-wash text-ok",
  warn: "bg-warn-wash text-warn",
  danger: "bg-danger-wash text-danger",
  info: "bg-info-wash text-info",
};

// Estados de project.status y document.status tal como los define el schema.
const STATUS_TONES = {
  Creado: "neutral",
  "En Revisión": "warn",
  Aprobado: "ok",
  Finalizado: "accent",
  Rechazado: "danger",
  Subido: "info",
  "Cambios Solicitados": "danger",
  Archivado: "neutral",
};

export const toneForStatus = (status) => STATUS_TONES[status] ?? "neutral";

const Badge = ({ tone = "neutral", status, className = "", children }) => {
  const resolved = status ? toneForStatus(status) : tone;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[resolved] ?? TONES.neutral,
        className,
      ].join(" ")}
    >
      {children ?? status}
    </span>
  );
};

Badge.propTypes = {
  tone: PropTypes.oneOf(["neutral", "accent", "ok", "warn", "danger", "info"]),
  status: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Badge;
