import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

/**
 * Modal único de la aplicación.
 *
 * Convivían tres implementaciones con overlays distintos (`bg-gray-800/75`,
 * `bg-black/50`, con y sin AnimatePresence). Esta cierra con Escape y bloquea
 * el scroll del fondo, cosa que ninguna de las tres hacía.
 */
const Modal = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  subHeader,
  footer,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(event) => event.stopPropagation()}
            className={`flex max-h-[90vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-pop`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                {title && (
                  <h2 className="font-display text-lg font-semibold text-content">{title}</h2>
                )}
                {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="-mr-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Franja fija entre la cabecera y el contenido: pestañas, filtros
                o cualquier control que deba seguir alcanzable mientras se
                recorre una lista larga. Va fuera del área con scroll, así que
                no hace falta recurrir a position:sticky. */}
            {subHeader && <div className="shrink-0 px-6 pt-4">{subHeader}</div>}

            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer && (
              <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

Modal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  description: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  children: PropTypes.node,
  subHeader: PropTypes.node,
  footer: PropTypes.node,
};

export default Modal;
