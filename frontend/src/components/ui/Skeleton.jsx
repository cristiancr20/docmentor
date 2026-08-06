import React from "react";
import PropTypes from "prop-types";

/** Marcador de carga. Debe calcar el layout real para que no salte al llegar los datos. */
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-surface-2 ${className}`} />
);

Skeleton.propTypes = { className: PropTypes.string };

export const SkeletonStats = ({ count = 3 }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton key={index} className="h-[86px]" />
    ))}
  </div>
);

SkeletonStats.propTypes = { count: PropTypes.number };

export const SkeletonRows = ({ count = 5 }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton key={index} className="h-14" />
    ))}
  </div>
);

SkeletonRows.propTypes = { count: PropTypes.number };

export default Skeleton;
