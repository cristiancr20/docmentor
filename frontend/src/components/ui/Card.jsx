import React from "react";
import PropTypes from "prop-types";

/** Contenedor base: superficie + borde de 1px. La sombra es casi imperceptible. */
const Card = ({ className = "", padded = true, children, ...props }) => (
  <div
    className={[
      "rounded-xl border border-line bg-surface shadow-card",
      padded ? "p-6" : "",
      className,
    ].join(" ")}
    {...props}
  >
    {children}
  </div>
);

Card.propTypes = {
  className: PropTypes.string,
  padded: PropTypes.bool,
  children: PropTypes.node,
};

export const CardHeader = ({ title, description, action }) => (
  <div className="mb-5 flex items-start justify-between gap-4">
    <div>
      <h2 className="font-display text-lg font-semibold text-content">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
    {action}
  </div>
);

CardHeader.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
};

export default Card;
