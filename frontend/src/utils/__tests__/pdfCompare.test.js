import { compareLineSets, normalizeForCompare, isHeading } from "../pdfCompare";

const asLines = (texts, page = 1) => texts.map((text) => ({ text, page }));

const withBox = (text, page = 1, section = null) => ({
  text,
  page,
  section,
  box: { left: 10, top: 20, width: 50, height: 2 },
});

describe("normalizeForCompare", () => {
  it("unifica comillas y guiones tipográficos", () => {
    expect(normalizeForCompare("“hola” ‘mundo’ — fin")).toBe('"hola" \'mundo\' - fin');
  });

  it("colapsa espacios repetidos y duros", () => {
    expect(normalizeForCompare("uno   dos tres")).toBe("uno dos tres");
  });

  it("conserva los guiones intermedios, que son contenido", () => {
    // La versión anterior los borraba junto con los espacios de alrededor, y
    // "2020 - 2024" acababa como "20202024".
    expect(normalizeForCompare("periodo 2020 - 2024")).toBe("periodo 2020 - 2024");
    expect(normalizeForCompare("enfoque teórico-práctico")).toBe("enfoque teórico-práctico");
  });
});

describe("isHeading", () => {
  it("reconoce los encabezados habituales de un trabajo académico", () => {
    expect(isHeading("Capítulo 1. Introducción")).toBe(true);
    expect(isHeading("2.3 Metodología aplicada")).toBe(true);
    expect(isHeading("CONCLUSIONES")).toBe(true);
    expect(isHeading("Bibliografía")).toBe(true);
  });

  it("no toma un párrafo corriente por encabezado", () => {
    expect(isHeading("El presente proyecto tiene como objetivo desarrollar un sistema.")).toBe(
      false
    );
    expect(isHeading("")).toBe(false);
  });
});

describe("compareLineSets", () => {
  it("no encuentra diferencias entre documentos idénticos", () => {
    const lines = asLines(["Capítulo 1", "El objetivo del proyecto es claro."]);
    const { hunks, summary } = compareLineSets(lines, lines);

    expect(hunks).toEqual([]);
    expect(summary.similarity).toBe(100);
  });

  it("detecta una línea añadida", () => {
    const before = asLines(["Introducción", "Contenido inicial."]);
    const after = asLines(["Introducción", "Contenido inicial.", "Párrafo nuevo."]);

    const { hunks, summary } = compareLineSets(before, after);

    expect(hunks).toHaveLength(1);
    expect(hunks[0].type).toBe("added");
    expect(hunks[0].after).toBe("Párrafo nuevo.");
    expect(summary.added).toBe(1);
  });

  it("detecta una línea eliminada", () => {
    const before = asLines(["Introducción", "Sección obsoleta.", "Cierre."]);
    const after = asLines(["Introducción", "Cierre."]);

    const { hunks } = compareLineSets(before, after);

    expect(hunks).toHaveLength(1);
    expect(hunks[0].type).toBe("removed");
    expect(hunks[0].before).toBe("Sección obsoleta.");
  });

  it("agrupa una eliminación y una adición contiguas como modificación", () => {
    const before = asLines(["Título", "El plazo es de tres meses."]);
    const after = asLines(["Título", "El plazo es de seis meses."]);

    const { hunks, summary } = compareLineSets(before, after);

    expect(hunks).toHaveLength(1);
    expect(hunks[0].type).toBe("modified");
    expect(summary.modified).toBe(1);
    // Dos cambios separados serían ruido; es una sola frase reescrita.
    expect(summary.added).toBe(0);
    expect(summary.removed).toBe(0);
  });

  it("marca a nivel de palabra qué cambió dentro de una modificación", () => {
    const before = asLines(["El plazo es de tres meses."]);
    const after = asLines(["El plazo es de seis meses."]);

    const [hunk] = compareLineSets(before, after).hunks;

    const removed = hunk.wordDiff.filter((part) => part.removed).map((p) => p.value.trim());
    const added = hunk.wordDiff.filter((part) => part.added).map((p) => p.value.trim());
    const untouched = hunk.wordDiff.filter((p) => !p.added && !p.removed);

    expect(removed).toContain("tres");
    expect(added).toContain("seis");
    // El resto de la frase no debe aparecer como cambio.
    expect(untouched.length).toBeGreaterThan(0);
  });

  it("sitúa cada cambio en su página", () => {
    const before = [...asLines(["Uno"], 1), ...asLines(["Dos"], 4)];
    const after = [...asLines(["Uno"], 1), ...asLines(["Dos"], 4), ...asLines(["Tres"], 7)];

    const [hunk] = compareLineSets(before, after).hunks;

    expect(hunk.page).toBe(7);
  });

  it("calcula la similitud según el contenido que se mantiene", () => {
    const before = asLines(["uno dos tres cuatro", "cinco seis siete ocho"]);
    const after = asLines(["uno dos tres cuatro", "totalmente distinto aquí ahora"]);

    const { summary } = compareLineSets(before, after);

    // Se conserva una de las dos líneas: la mitad de las palabras.
    expect(summary.similarity).toBe(50);
  });

  it("informa del recuento de palabras de cada versión", () => {
    const before = asLines(["una dos"]);
    const after = asLines(["una dos tres"]);

    const { summary } = compareLineSets(before, after);

    expect(summary.wordsBefore).toBe(2);
    expect(summary.wordsAfter).toBe(3);
  });

  it("indica de qué apartado procede el cambio", () => {
    const before = [
      withBox("Capítulo 2. Marco teórico", 3, "Capítulo 2. Marco teórico"),
      withBox("Definición original.", 3, "Capítulo 2. Marco teórico"),
    ];
    const after = [
      withBox("Capítulo 2. Marco teórico", 3, "Capítulo 2. Marco teórico"),
      withBox("Definición revisada.", 3, "Capítulo 2. Marco teórico"),
    ];

    const [hunk] = compareLineSets(before, after).hunks;

    expect(hunk.section).toBe("Capítulo 2. Marco teórico");
  });

  it("acompaña el cambio con las líneas intactas de alrededor", () => {
    const before = asLines(["Antes.", "Cambia esto.", "Después."]);
    const after = asLines(["Antes.", "Cambió aquello.", "Después."]);

    const [hunk] = compareLineSets(before, after).hunks;

    // Sin contexto, un fragmento suelto parece una línea completa del documento.
    expect(hunk.contextBefore).toBe("Antes.");
    expect(hunk.contextAfter).toBe("Después.");
  });

  it("devuelve las áreas para resaltar sobre cada PDF", () => {
    const before = [withBox("Se elimina esto", 2)];
    const after = [withBox("Se agrega aquello", 5)];

    const { highlights } = compareLineSets(before, after);

    // pageIndex es base 0 porque es lo que espera el visor.
    expect(highlights.before).toEqual([
      { pageIndex: 1, left: 10, top: 20, width: 50, height: 2 },
    ]);
    expect(highlights.after).toEqual([
      { pageIndex: 4, left: 10, top: 20, width: 50, height: 2 },
    ]);
  });

  it("no genera áreas cuando las líneas no traen posición", () => {
    const before = asLines(["Sin geometría"]);
    const after = asLines(["Otra cosa"]);

    const { highlights } = compareLineSets(before, after);

    expect(highlights.before).toEqual([]);
    expect(highlights.after).toEqual([]);
  });

  it("no confunde reordenar con reescribir", () => {
    const before = asLines(["Alfa", "Beta", "Gamma"]);
    const after = asLines(["Beta", "Gamma", "Alfa"]);

    const { hunks } = compareLineSets(before, after);

    // Alfa se mueve: sale de un sitio y entra en otro, pero Beta y Gamma
    // siguen reconociéndose como iguales.
    const changedTexts = hunks.flatMap((h) => [h.before, h.after]).join(" ");
    expect(changedTexts).toContain("Alfa");
    expect(changedTexts).not.toContain("Beta");
  });
});
