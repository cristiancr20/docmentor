import React from "react";
import PropTypes from "prop-types";

/** Métrica de dashboard: cifra en display + tabular-nums, icono lavado. */
const StatCard = ({ label, value, icon: Icon, tone = "accent" }) => {
  const TONES = {
    accent: "bg-accent-wash text-accent",
    ok: "bg-ok-wash text-ok",
    warn: "bg-warn-wash text-warn",
    danger: "bg-danger-wash text-danger",
    info: "bg-info-wash text-info",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold tabular text-content">{value}</p>
      </div>
      {Icon && (
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${TONES[tone]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  label: PropTypes.node,
  value: PropTypes.node,
  icon: PropTypes.elementType,
  tone: PropTypes.oneOf(["accent", "ok", "warn", "danger", "info"]),
};

export default StatCard;
