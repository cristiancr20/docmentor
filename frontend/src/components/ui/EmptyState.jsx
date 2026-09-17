import React from "react";
import PropTypes from "prop-types";

/** Estado vacío consistente: cada lista mostraba su propio texto suelto y sin forma. */
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-12 text-center">
    {Icon && (
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-muted">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
    )}
    <p className="font-medium text-content">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
};

export default EmptyState;
