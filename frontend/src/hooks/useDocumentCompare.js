import { useCallback, useEffect, useRef, useState } from "react";

import { API_URL } from "../core/config.js";
import { getCommentsByDocument } from "../core/Comments";
import { comparePdfDocuments } from "../utils/pdfCompare";
import { HIGHLIGHT_COLORS } from "../utils/highlightColors";
import logger from "../utils/logger";

// Sin guardas, un índice fuera de rango o un documento sin archivo adjunto
// dejaban la pantalla en blanco.
const fileUrl = (doc) => {
  const url = doc?.attributes?.documentFile?.data?.[0]?.attributes?.url;
  return url ? `${API_URL}${url}` : null;
};

const toNotes = (comments) =>
  comments.map((comment) => ({
    id: comment.id,
    content: comment.attributes.correction,
    highlightAreas: JSON.parse(comment.attributes.highlightAreas || "[]") || [],
    quote: comment.attributes.quote || "",
  }));

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
    color: tone === "removed" ? HIGHLIGHT_COLORS.removed : HIGHLIGHT_COLORS.added,
    readOnly: true,
  }));

/**
 * Estado y orquestación del comparador de versiones: lanza `comparePdfDocuments`
 * sobre el par recibido, carga los comentarios de cada versión y mantiene la
 * pestaña, el filtro y la sincronía de scroll entre visores.
 *
 * `DocumentComparePopup` solo pinta lo que sale de aquí.
 */
export default function useDocumentCompare(doc1, doc2) {
  const [notesBefore, setNotesBefore] = useState([]);
  const [notesAfter, setNotesAfter] = useState([]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  // Identifica la comparación en curso para descartar resultados de una
  // anterior que termine tarde (p.ej. al cambiar de par mientras carga).
  const runIdRef = useRef(0);

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

  const urlBefore = fileUrl(doc1);
  const urlAfter = fileUrl(doc2);
  const doc1Id = doc1?.id;
  const doc2Id = doc2?.id;

  const canCompare = Boolean(urlBefore && urlAfter);

  const runComparison = useCallback(async () => {
    if (!urlBefore || !urlAfter) return;

    const runId = ++runIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const comparison = await comparePdfDocuments(urlBefore, urlAfter);
      if (runId !== runIdRef.current) return;
      setResult(comparison);
    } catch (err) {
      if (runId !== runIdRef.current) return;
      logger.error("Error comparando documentos:", err);
      setError(err);
    } finally {
      if (runId === runIdRef.current) setLoading(false);
    }
  }, [urlBefore, urlAfter]);

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

        setNotesBefore(toNotes(comments1));
        setNotesAfter(toNotes(comments2));
      } catch (err) {
        logger.error("Error al cargar los comentarios:", err);
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

  const goToPage = useCallback((page) => {
    setTargetPage(page);
    setTab("side-by-side");
  }, []);

  const done = !loading && !error && result !== null;
  const showDiffOverlay = done && !result.textLayerMissing;
  // Hay resultado utilizable en cuanto la comparación termina y los PDF traen
  // texto, aunque no haya ninguna diferencia (100% en común es un dato válido).
  const hasResult = showDiffOverlay && Boolean(result.summary);
  const similarity = hasResult ? result.summary.similarity : null;

  const hunks = result?.hunks ?? [];
  const visibleHunks = filter === "all" ? hunks : hunks.filter((hunk) => hunk.type === filter);

  const notesForPane = (baseNotes, side) => {
    if (!showDiffOverlay) return baseNotes;

    const areas = side === "before" ? result.highlights?.before : result.highlights?.after;
    return [...baseNotes, ...diffNotes(areas, side === "before" ? "removed" : "added")];
  };

  const panes = [
    {
      side: "before",
      title: doc1?.attributes?.title ?? "Versión anterior",
      version: doc1?.attributes?.version,
      url: urlBefore,
      notes: notesForPane(notesBefore, "before"),
      onScrollerReady: registerBefore,
    },
    {
      side: "after",
      title: doc2?.attributes?.title ?? "Versión reciente",
      version: doc2?.attributes?.version,
      url: urlAfter,
      notes: notesForPane(notesAfter, "after"),
      onScrollerReady: registerAfter,
    },
  ];

  return {
    canCompare,
    panes,
    result,
    similarity,
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
  };
}
