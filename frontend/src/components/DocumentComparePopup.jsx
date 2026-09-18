import React from "react";
import PropTypes from "prop-types";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Columns2,
  FileSearch,
  GitCompare,
  RefreshCw,
  ScanLine,
} from "lucide-react";

import useDocumentCompare from "../hooks/useDocumentCompare";

import PdfViewer from "./PdfViewer.tsx";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import { SkeletonRows } from "./ui/Skeleton";
import ChangeList from "./compare/ChangeList";
import CompareSummary, { SimilarityBadge } from "./compare/CompareSummary";

const tabs = [
  { key: "changes", label: "Cambios", icon: FileSearch },
  { key: "side-by-side", label: "Lado a lado", icon: Columns2 },
];

/**
 * Comparador de versiones.
 *
 * El estado y la orquestación viven en `useDocumentCompare`; aquí solo queda
 * el JSX. El worker de pdf.js lo configura src/setupPdfWorker.js al arrancar
 * la aplicación.
 */
const DocumentComparePopup = ({ documents, onClose, currentIndex, setCurrentIndex }) => {
  const sortedDocuments = [...documents].sort((a, b) => a.id - b.id);
  const doc1 = sortedDocuments[currentIndex];
  const doc2 = sortedDocuments[currentIndex + 1];

  const {
    canCompare,
    panes,
    result,
    loading,
    error,
    hasResult,
    showDiffOverlay,
    hunks,
    visibleHunks,
    filter,
    setFilter,
    tab,
    setTab,
    targetPage,
    goToPage,
    syncScroll,
    setSyncScroll,
    runComparison,
    contentRef,
  } = useDocumentCompare(doc1, doc2);

  const [before, after] = panes;

  const handlePrevious = () => setCurrentIndex(currentIndex - 1);
  const handleNext = () => setCurrentIndex(currentIndex + 1);

  // Hacen falta dos versiones con archivo para poder comparar.
  if (!canCompare) {
    return (
      <Modal
        open
        onClose={onClose}
        size="sm"
        title="No hay versiones que comparar"
        footer={
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        <EmptyState
          icon={GitCompare}
          title="Faltan versiones"
          description="Se necesitan al menos dos versiones con archivo adjunto para usar el comparador."
        />
      </Modal>
    );
  }

  const renderChanges = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">Extrayendo el texto de ambas versiones…</p>
          <SkeletonRows count={4} />
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title="No se pudo comparar"
          description="Falló la lectura de alguno de los archivos. Comprueba que ambos sean PDF válidos."
          action={
            <Button variant="secondary" onClick={runComparison}>
              <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
              Reintentar
            </Button>
          }
        />
      );
    }

    if (result?.textLayerMissing) {
      return (
        <EmptyState
          icon={ScanLine}
          title="Los documentos no contienen texto"
          description="Parecen escaneados o generados como imagen. Sin una capa de texto no hay nada que comparar; haría falta pasarlos por OCR."
        />
      );
    }

    if (hunks.length === 0) {
      return (
        <EmptyState
          icon={GitCompare}
          title="Las dos versiones son idénticas"
          description="No se encontró ninguna diferencia de contenido entre ellas."
        />
      );
    }

    return <ChangeList hunks={visibleHunks} onGoToPage={goToPage} />;
  };

  // Los filtros solo tienen sentido si hay algo que filtrar, y viven en la
  // zona fija para seguir alcanzables con listas largas.
  const showFilters = hasResult && tab === "changes" && hunks.length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Comparador de versiones"
      description={`${before.title}${before.version ? ` (v${before.version})` : ""} → ${
        after.title
      }${after.version ? ` (v${after.version})` : ""}`}
      subHeader={
        <>
          <div className="flex items-center gap-1 border-b border-line">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={[
                  "-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  tab === key
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-content",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                {label}
              </button>
            ))}

            {/* La similitud acompaña a las pestañas, no al panel de cambios:
                sigue siendo el dato de referencia en la vista lado a lado. */}
            {hasResult && (
              <div className="ml-auto pb-2 pr-1">
                <SimilarityBadge summary={result.summary} />
              </div>
            )}
          </div>

          {showFilters && (
            <div className="pt-4">
              <CompareSummary
                summary={result.summary}
                activeFilter={filter}
                onFilterChange={setFilter}
              />
            </div>
          )}
        </>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="secondary" onClick={handlePrevious} disabled={currentIndex === 0}>
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            Par anterior
          </Button>

          <Button variant="ghost" onClick={runComparison} loading={loading} disabled={loading}>
            <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
            Recalcular
          </Button>

          <Button
            variant="secondary"
            onClick={handleNext}
            disabled={currentIndex >= documents.length - 2}
          >
            Par siguiente
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          </Button>
        </div>
      }
    >
      <div ref={contentRef}>
      {tab === "changes" ? (
        renderChanges()
      ) : (
        <div className="flex flex-col gap-3">
          {showDiffOverlay && (
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface-2 px-4 py-2 text-xs text-muted">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                Se eliminó en la versión nueva
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-ok" />
                Se agregó en la versión nueva
              </span>
              <span className="flex items-center gap-2">
                {/* Amarillo literal: es el color con el que el visor pinta los
                    comentarios, así que la leyenda debe coincidir. */}
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: "yellow" }}
                />
                Comentario de revisión
              </span>

              <label className="ml-auto flex cursor-pointer items-center gap-2 text-content">
                <input
                  type="checkbox"
                  checked={syncScroll}
                  onChange={(event) => setSyncScroll(event.target.checked)}
                  className="h-3.5 w-3.5 accent-accent"
                />
                Desplazar ambos a la vez
              </label>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {panes.map((pane) => (
              <div key={pane.url} className="rounded-xl border border-line bg-surface-2 p-3">
                <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-content">
                  {pane.title}
                  {pane.version && (
                    <span className="font-mono text-xs font-normal text-muted">
                      v{pane.version}
                    </span>
                  )}
                </h3>
                <div className="h-[60vh] overflow-auto rounded-lg bg-surface">
                  <PdfViewer
                    fileUrl={pane.url}
                    notes={pane.notes}
                    onAddNote={() => {}}
                    canComment={false}
                    selectedHighlightId={null}
                    goToPage={targetPage}
                    onScrollerReady={pane.onScrollerReady}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </Modal>
  );
};

DocumentComparePopup.propTypes = {
  documents: PropTypes.array.isRequired,
  onClose: PropTypes.func,
  currentIndex: PropTypes.number.isRequired,
  setCurrentIndex: PropTypes.func,
};

export default DocumentComparePopup;
