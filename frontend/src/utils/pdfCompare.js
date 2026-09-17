import { diffArrays, diffWordsWithSpace } from "diff";
import * as pdfjsLib from "pdfjs-dist";

/**
 * Comparación de documentos PDF.
 *
 * La versión anterior producía muchísimas diferencias falsas por dos motivos,
 * ninguno achacable a la librería de diff:
 *
 * 1. Extraía el texto con `items.map(i => i.str).join(" ")`. pdf.js parte el
 *    texto en fragmentos que a menudo cortan una palabra por la mitad, así que
 *    unirlos siempre con un espacio convertía "Universidad" en "Univers idad".
 *    Dos PDF con el mismo contenido se fragmentan distinto, de modo que casi
 *    todo el documento salía como diferencia.
 *
 * 2. "Normalizaba" borrando todos los guiones junto con los espacios que los
 *    rodeaban, así que "2020 - 2024" quedaba como "20202024" y "casa - perro"
 *    como "casaperro".
 *
 * Aquí el texto se reconstruye por líneas usando la geometría de la página, y
 * la normalización solo unifica lo que es equivalente (comillas tipográficas,
 * guiones de partición al final de línea, espacios repetidos), sin borrar nada.
 */

// Separación mínima, relativa al alto de la fuente, para considerar que entre
// dos fragmentos hay un espacio de verdad y no una partición del propio PDF.
const SPACE_GAP_RATIO = 0.2;

// Tolerancia vertical para decidir que dos fragmentos van en la misma línea.
const LINE_TOLERANCE_RATIO = 0.5;

/** Une los fragmentos de una línea respetando la separación real entre ellos. */
const joinLineItems = (items) => {
  const sorted = [...items].sort((a, b) => a.x - b.x);

  return sorted
    .reduce((acc, item, index) => {
      if (index === 0) return item.text;

      const previous = sorted[index - 1];
      const gap = item.x - (previous.x + previous.width);
      const threshold = Math.max(previous.height, item.height) * SPACE_GAP_RATIO;

      // Si el fragmento anterior ya termina en espacio, o el hueco es
      // suficiente, hay separación; si no, es la misma palabra partida.
      const needsSpace = gap > threshold && !/\s$/.test(acc) && !/^\s/.test(item.text);

      return acc + (needsSpace ? " " : "") + item.text;
    }, "")
    .trim();
};

/**
 * Rectángulo que envuelve a los fragmentos de una línea, en porcentaje de la
 * página. Es el formato que espera el visor para pintar un resaltado encima.
 */
const boundingBox = (items, viewport) => {
  const left = Math.min(...items.map((item) => item.x));
  const right = Math.max(...items.map((item) => item.x + item.width));
  const bottom = Math.min(...items.map((item) => item.y));
  const top = Math.max(...items.map((item) => item.y + item.height));

  return {
    left: (left / viewport.width) * 100,
    top: ((viewport.height - top) / viewport.height) * 100,
    width: ((right - left) / viewport.width) * 100,
    height: ((top - bottom) / viewport.height) * 100,
  };
};

/** Agrupa los fragmentos de una página en líneas por su posición vertical. */
const groupIntoLines = (items, viewport) => {
  const lines = [];

  items.forEach((item) => {
    if (!item.text) return;

    const tolerance = Math.max(item.height, 1) * LINE_TOLERANCE_RATIO;
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);

    if (line) {
      line.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  });

  // De arriba abajo: en PDF el origen está abajo, así que y mayor va primero.
  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) => ({
      text: joinLineItems(line.items),
      box: viewport ? boundingBox(line.items, viewport) : null,
    }))
    .filter((line) => line.text.length > 0);
};

// Encabezados habituales de un documento académico. Sirven para decir de qué
// parte del documento viene cada cambio, en vez de mostrarlo suelto.
const HEADING_KEYWORDS =
  /^(cap[íi]tulo|secci[óo]n|anexo|ap[ée]ndice|introducci[óo]n|conclusiones?|bibliograf[íi]a|resumen|abstract|objetivos?|metodolog[íi]a|marco\s+te[óo]rico|recomendaciones|justificaci[óo]n|antecedentes)\b/i;

// "1.", "2.3", "4.1.2 Algo": numeración de apartados.
const NUMBERED_HEADING = /^\d+(\.\d+)*[.)]?\s+\S/;

/**
 * Heurística de encabezado. No hay forma fiable de saberlo desde el texto
 * plano de un PDF, así que se combinan tres señales: palabra clave conocida,
 * numeración de apartado, o línea corta en mayúsculas.
 */
export const isHeading = (text) => {
  if (!text || text.length > 90) return false;

  if (HEADING_KEYWORDS.test(text)) return true;
  if (NUMBERED_HEADING.test(text) && text.length < 80) return true;

  const letters = text.replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/g, "");
  return letters.length > 3 && letters === letters.toUpperCase();
};

/**
 * Normaliza para comparar. Unifica variantes tipográficas que representan lo
 * mismo, sin eliminar contenido: si dos textos difieren de verdad, deben seguir
 * difiriendo después de pasar por aquí.
 */
export const normalizeForCompare = (text) =>
  text
    .normalize("NFC")
    .replace(/[\u00A0\u2007\u202F\u2009]/g, " ") // espacios duros y finos
    .replace(/[‘’‛]/g, "'") // comillas simples tipográficas
    .replace(/[“”]/g, '"') // comillas dobles tipográficas
    .replace(/[‐‑‒–—]/g, "-") // guiones y rayas
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Une las palabras partidas por guion al final de línea. Es la única supresión
 * de guiones legítima: "univer-\nsidad" es la misma palabra que "universidad".
 * Los guiones dentro de una línea (teórico-práctico, 2020-2024) se conservan.
 */
const joinHyphenatedLines = (lines) => {
  const result = [];

  for (let index = 0; index < lines.length; index += 1) {
    let current = { ...lines[index] };

    while (/[a-záéíóúñü]-$/i.test(current.text) && index + 1 < lines.length) {
      const next = lines[index + 1];
      if (!/^[a-záéíóúñü]/i.test(next.text)) break;

      current = { ...current, text: current.text.replace(/-$/, "") + next.text };
      index += 1;
    }

    result.push(current);
  }

  return result;
};

/** Extrae el texto de un PDF como líneas, conservando el número de página. */
export const extractPdfLines = async (url) => {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    // eslint-disable-next-line no-await-in-loop
    const page = await pdf.getPage(pageNumber);
    // eslint-disable-next-line no-await-in-loop
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    const items = content.items
      .filter((item) => typeof item.str === "string")
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width ?? 0,
        height: item.height || Math.abs(item.transform[3]) || 10,
      }));

    const lines = joinHyphenatedLines(groupIntoLines(items, viewport))
      .map((line) => ({ ...line, text: normalizeForCompare(line.text) }))
      .filter((line) => line.text);

    pages.push({ pageNumber, lines });
  }

  await pdf.destroy();

  return pages;
};

/**
 * Aplana las páginas en líneas, arrastrando el último encabezado visto. Así
 * cada cambio puede decir de qué apartado procede en lugar de aparecer suelto.
 */
const flattenPages = (pages) => {
  let section = null;

  return pages.flatMap((page) =>
    page.lines.map((line) => {
      if (isHeading(line.text)) section = line.text;

      return {
        text: line.text,
        page: page.pageNumber,
        box: line.box,
        section,
      };
    })
  );
};

const countWords = (text) => (text ? text.split(/\s+/).filter(Boolean).length : 0);

/**
 * Compara dos documentos ya extraídos.
 *
 * Trabaja en dos niveles: primero alinea líneas, que da la estructura y permite
 * situar cada cambio en su página; después, dentro de cada bloque modificado,
 * afina a nivel de palabra. Comparar todo el documento como una sola cadena,
 * que es lo que se hacía antes, devolvía una lista plana de fragmentos sueltos
 * imposible de situar.
 */
export const compareLineSets = (linesA, linesB) => {
  const textsA = linesA.map((line) => line.text);
  const textsB = linesB.map((line) => line.text);

  const parts = diffArrays(textsA, textsB);

  const hunks = [];
  let indexA = 0;
  let indexB = 0;
  let unchangedWords = 0;

  // Se acumulan los tramos eliminados y añadidos contiguos: un bloque que
  // desaparece y otro que aparece justo después es una modificación, no dos
  // cambios independientes.
  let pending = null;

  // Áreas para pintar el resaltado sobre el propio PDF, separadas por documento.
  const highlightsBefore = [];
  const highlightsAfter = [];

  const toHighlight = (line) =>
    line?.box ? { pageIndex: line.page - 1, ...line.box } : null;

  const flushPending = () => {
    if (!pending) return;

    const beforeText = pending.before.map((line) => line.text).join("\n");
    const afterText = pending.after.map((line) => line.text).join("\n");

    pending.before.forEach((line) => {
      const area = toHighlight(line);
      if (area) highlightsBefore.push(area);
    });
    pending.after.forEach((line) => {
      const area = toHighlight(line);
      if (area) highlightsAfter.push(area);
    });

    // El apartado se toma de donde vive el cambio; el contexto son las líneas
    // intactas de alrededor, para que se vea que el fragmento no es una línea
    // suelta sino parte de un párrafo.
    const anchor = pending.before[0] ?? pending.after[0];

    const common = {
      page: pending.page,
      section: anchor?.section ?? null,
      contextBefore: pending.contextBefore,
      contextAfter: null, // se rellena al cerrar el recorrido
    };

    if (pending.before.length && pending.after.length) {
      hunks.push({
        ...common,
        type: "modified",
        before: beforeText,
        after: afterText,
        wordDiff: diffWordsWithSpace(beforeText, afterText),
      });
    } else if (pending.before.length) {
      hunks.push({ ...common, type: "removed", before: beforeText, after: "" });
    } else {
      hunks.push({ ...common, type: "added", before: "", after: afterText });
    }

    pending = null;
  };

  // Última línea sin cambios vista: sirve de contexto anterior del siguiente
  // bloque, y la primera línea intacta tras un bloque, de contexto posterior.
  let lastUnchanged = null;

  parts.forEach((part) => {
    const values = part.value;

    if (!part.added && !part.removed) {
      const justClosed = pending !== null;
      flushPending();

      if (justClosed && hunks.length > 0) {
        hunks[hunks.length - 1].contextAfter = values[0] ?? null;
      }

      values.forEach((text) => {
        unchangedWords += countWords(text);
      });

      lastUnchanged = values[values.length - 1] ?? lastUnchanged;
      indexA += values.length;
      indexB += values.length;
      return;
    }

    if (!pending) {
      pending = {
        before: [],
        after: [],
        page: part.removed ? linesA[indexA]?.page : linesB[indexB]?.page,
        contextBefore: lastUnchanged,
      };
    }

    if (part.removed) {
      pending.before.push(...values.map((text, offset) => linesA[indexA + offset] ?? { text }));
      if (pending.page == null) pending.page = linesA[indexA]?.page;
      indexA += values.length;
    } else {
      pending.after.push(...values.map((text, offset) => linesB[indexB + offset] ?? { text }));
      if (pending.page == null) pending.page = linesB[indexB]?.page;
      indexB += values.length;
    }
  });

  flushPending();

  const totalWordsA = textsA.reduce((sum, text) => sum + countWords(text), 0);
  const totalWordsB = textsB.reduce((sum, text) => sum + countWords(text), 0);
  const maxWords = Math.max(totalWordsA, totalWordsB, 1);

  return {
    hunks,
    highlights: { before: highlightsBefore, after: highlightsAfter },
    summary: {
      added: hunks.filter((hunk) => hunk.type === "added").length,
      removed: hunks.filter((hunk) => hunk.type === "removed").length,
      modified: hunks.filter((hunk) => hunk.type === "modified").length,
      // Porcentaje de contenido que se mantiene igual entre ambas versiones.
      similarity: Math.round((unchangedWords / maxWords) * 100),
      wordsBefore: totalWordsA,
      wordsAfter: totalWordsB,
    },
  };
};

/** Descarga, extrae y compara dos PDF. */
export const comparePdfDocuments = async (urlA, urlB) => {
  const [pagesA, pagesB] = await Promise.all([extractPdfLines(urlA), extractPdfLines(urlB)]);

  const linesA = flattenPages(pagesA);
  const linesB = flattenPages(pagesB);

  if (linesA.length === 0 && linesB.length === 0) {
    // Un PDF escaneado no expone texto: sin OCR no hay nada que comparar, y
    // decir "no hay diferencias" sería engañoso.
    return {
      hunks: [],
      summary: null,
      textLayerMissing: true,
    };
  }

  return {
    ...compareLineSets(linesA, linesB),
    textLayerMissing: false,
    pageCount: { before: pagesA.length, after: pagesB.length },
  };
};
