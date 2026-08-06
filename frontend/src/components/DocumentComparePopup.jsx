import React, { useCallback, useEffect, useRef, useState } from "react";
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

import { API_URL } from "../core/config.js";
import { getCommentsByDocument } from "../core/Comments";
import { comparePdfDocuments } from "../utils/pdfCompare";

import DisplayNotesSidebarExample from "./DisplayNotesSidebarExample.tsx";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import { SkeletonRows } from "./ui/Skeleton";
import ChangeList from "./compare/ChangeList";
import CompareSummary, { SimilarityBadge } from "./compare/CompareSummary";

/**
 * Comparador de versiones.
 *
 * El worker de pdf.js lo configura src/setupPdfWorker.js al arrancar la
 * aplicación. Antes este archivo lo reasignaba a un CDN y además importaba
 * `pdf.worker.entry`, así que había tres configuraciones compitiendo y la
 * comparación dependía de que cdnjs estuviera accesible.
 */
const DocumentComparePopup = ({ documents, onClose, currentIndex, setCurrentIndex }) => {
  const [notesDocument1, setNotesDocument1] = useState([]);
  const [notesDocument2, setNotesDocument2] = useState([]);

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState("changes"); // changes | side-by-side
  // Página a la que saltar cuando se pulsa "página N" en la lista de cambios.
  const [targetPage, setTargetPage] = useState(null);

  const contentRef = useRef(null);

  const [syncScroll, setSyncScroll] = useState(true);
  // Los visores avisan de su contenedor de scroll cuando terminan de cargar el
  // PDF. Va en estado y no en una ref porque el enlace de los listeners tiene
  // que rehacerse en cuanto aparecen, no antes.
  const [scrollers, setScrollers] = useState({ before: null, after: null });
  // Evita el rebote: al mover un panel movemos el otro, y ese movimiento
  // dispararía a su vez el listener contrario en bucle.
  const syncingRef = useRef(false);

  // Identidad estable: si cambiara en cada render, el visor volvería a
  // registrarse sin parar y el efecto de sincronía no llegaría a enlazarse.
  const registerBefore = useCallback(
    (element) => setScrollers((current) => ({ ...current, before: element })),
    []
  );
  const registerAfter = useCallback(
    (element) => setScrollers((current) => ({ ...current, after: element })),
    []
  );

  const sortedDocuments = [...documents].sort((a, b) => a.id - b.id);
  const doc1 = sortedDocuments[currentIndex];
  const doc2 = sortedDocuments[currentIndex + 1];

  // Sin guardas, un índice fuera de rango o un documento sin archivo adjunto
  // dejaban la pantalla en blanco.
  const fileUrl = (doc) => {
    const url = doc?.attributes?.documentFile?.data?.[0]?.attributes?.url;
    return url ? `${API_URL}${url}` : null;
  };

  const documento1 = fileUrl(doc1);
  const documento2 = fileUrl(doc2);

  const doc1Id = doc1?.id;
  const doc2Id = doc2?.id;

  const nameDocumento1 = doc1?.attributes?.title ?? "Versión anterior";
  const nameDocumento2 = doc2?.attributes?.title ?? "Versión reciente";
  const version1 = doc1?.attributes?.version;
  const version2 = doc2?.attributes?.version;

  const canCompare = Boolean(documento1 && documento2);

  const runComparison = useCallback(async () => {
    if (!documento1 || !documento2) return;

    setStatus("loading");
    try {
      setResult(await comparePdfDocuments(documento1, documento2));
      setStatus("done");
    } catch (error) {
      console.error("Error comparando documentos:", error);
      setStatus("error");
    }
  }, [documento1, documento2]);

  // La comparación arranca sola al abrir y al cambiar de par de versiones:
  // antes había que pulsar un botón para que la vista dejara de estar vacía.
  useEffect(() => {
    setResult(null);
    setFilter("all");
    runComparison();
  }, [runComparison]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!doc1Id || !doc2Id) return;

      try {
        const [comments1, comments2] = await Promise.all([
          getCommentsByDocument(doc1Id),
          getCommentsByDocument(doc2Id),
        ]);

        const toNotes = (comments) =>
          comments.map((comment) => ({
            id: comment.id,
            content: comment.attributes.correction,
            highlightAreas: JSON.parse(comment.attributes.highlightAreas || "[]") || [],
            quote: comment.attributes.quote || "",
          }));

        setNotesDocument1(toNotes(comments1));
        setNotesDocument2(toNotes(comments2));
      } catch (error) {
        console.error("Error al cargar los comentarios:", error);
      }
    };

    loadNotes();
  }, [doc1Id, doc2Id]);

  // Al cambiar de pestaña se conservaba el desplazamiento de la anterior, así
  // que se entraba a mitad de la vista nueva.
  useEffect(() => {
    contentRef.current?.parentElement?.scrollTo({ top: 0 });
  }, [tab]);

  /**
   * Desplazamiento sincronizado entre los dos visores.
   *
   * Se sincroniza en proporción, no en píxeles: las dos versiones rara vez
   * miden lo mismo, y copiar el scrollTop tal cual desalinea en cuanto una
   * tiene una página de más.
   */
  useEffect(() => {
    if (tab !== "side-by-side" || !syncScroll) return undefined;

    const { before, after } = scrollers;
    if (!before || !after) return undefined;

    const mirror = (source, target) => () => {
      if (syncingRef.current) return;

      const sourceRange = source.scrollHeight - source.clientHeight;
      const targetRange = target.scrollHeight - target.clientHeight;
      if (sourceRange <= 0 || targetRange <= 0) return;

      syncingRef.current = true;
      target.scrollTop = (source.scrollTop / sourceRange) * targetRange;

      // Se libera en el siguiente frame: el scroll que acabamos de provocar
      // emite su propio evento.
      requestAnimationFrame(() => {
        syncingRef.current = false;
      });
    };

    const onBefore = mirror(before, after);
    const onAfter = mirror(after, before);

    before.addEventListener("scroll", onBefore, { passive: true });
    after.addEventListener("scroll", onAfter, { passive: true });

    return () => {
      before.removeEventListener("scroll", onBefore);
      after.removeEventListener("scroll", onAfter);
    };
  }, [tab, syncScroll, scrollers]);

  const handlePrevious = () => setCurrentIndex(currentIndex - 1);
  const handleNext = () => setCurrentIndex(currentIndex + 1);

  /**
   * Los resaltados del comparador viajan como "notas" porque es lo que sabe
   * pintar el visor, pero llevan color propio y son de solo lectura: rojo para
   * lo que desaparece en la versión anterior, verde para lo que se añade en la
   * nueva. Los ids van en negativo para no chocar con los de los comentarios.
   */
  const diffNotes = (areas, tone) =>
    (areas ?? []).map((area, index) => ({
      id: -(index + 1),
      content: tone === "removed" ? "Texto eliminado en la nueva versión" : "Texto agregado",
      quote: "",
      highlightAreas: [area],
      color: tone === "removed" ? "#f87171" : "#34d399",
      readOnly: true,
    }));

  const showDiffOverlay = status === "done" && !result?.textLayerMissing;

  const notesForPane = (baseNotes, side) => {
    if (!showDiffOverlay) return baseNotes;

    const areas = side === "before" ? result?.highlights?.before : result?.highlights?.after;
    return [...baseNotes, ...diffNotes(areas, side === "before" ? "removed" : "added")];
  };

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

  const hunks = result?.hunks ?? [];
  const visibleHunks = filter === "all" ? hunks : hunks.filter((hunk) => hunk.type === filter);

  const renderChanges = () => {
    if (status === "loading") {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">Extrayendo el texto de ambas versiones…</p>
          <SkeletonRows count={4} />
        </div>
      );
    }

    if (status === "error") {
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

    return (
      <ChangeList
        hunks={visibleHunks}
        onGoToPage={(page) => {
          setTargetPage(page);
          setTab("side-by-side");
        }}
      />
    );
  };

  const tabs = [
    { key: "changes", label: "Cambios", icon: FileSearch },
    { key: "side-by-side", label: "Lado a lado", icon: Columns2 },
  ];

  // Hay resultado utilizable en cuanto la comparación termina y los PDF traen
  // texto, aunque no haya ninguna diferencia (100% en común es un dato válido).
  const hasResult = status === "done" && !result?.textLayerMissing && Boolean(result?.summary);

  // Los filtros solo tienen sentido si hay algo que filtrar, y viven en la
  // zona fija para seguir alcanzables con listas largas.
  const showFilters = hasResult && tab === "changes" && hunks.length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Comparador de versiones"
      description={`${nameDocumento1}${version1 ? ` (v${version1})` : ""} → ${nameDocumento2}${
        version2 ? ` (v${version2})` : ""
      }`}
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

          <Button
            variant="ghost"
            onClick={runComparison}
            loading={status === "loading"}
            disabled={status === "loading"}
          >
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
            {[
              {
                side: "before",
                title: nameDocumento1,
                version: version1,
                url: documento1,
                notes: notesDocument1,
              },
              {
                side: "after",
                title: nameDocumento2,
                version: version2,
                url: documento2,
                notes: notesDocument2,
              },
            ].map((pane) => (
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
                  <DisplayNotesSidebarExample
                    fileUrl={pane.url}
                    notes={notesForPane(pane.notes, pane.side)}
                    onAddNote={() => {}}
                    canComment={false}
                    selectedHighlightId={null}
                    goToPage={targetPage}
                    onScrollerReady={pane.side === "before" ? registerBefore : registerAfter}
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
