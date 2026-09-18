import { act, renderHook, waitFor } from "@testing-library/react";
import useDocumentCompare from "../useDocumentCompare";
import { comparePdfDocuments } from "../../utils/pdfCompare";
import { getCommentsByDocument } from "../../core/Comments";
import { HIGHLIGHT_COLORS } from "../../utils/highlightColors";

vi.mock("../../utils/pdfCompare", () => ({
  comparePdfDocuments: vi.fn(),
}));

vi.mock("../../core/Comments", () => ({
  getCommentsByDocument: vi.fn(),
}));

vi.mock("../../core/config.js", () => ({
  API_URL: "http://api.test",
}));

const makeDoc = (id, { title, version, url } = {}) => ({
  id,
  attributes: {
    title,
    version,
    documentFile: url ? { data: [{ attributes: { url } }] } : { data: [] },
  },
});

const docBefore = makeDoc(1, { title: "Tesis", version: 1, url: "/uploads/v1.pdf" });
const docAfter = makeDoc(2, { title: "Tesis", version: 2, url: "/uploads/v2.pdf" });

const comparison = {
  hunks: [
    { type: "added", page: 2 },
    { type: "removed", page: 1 },
    { type: "modified", page: 3 },
  ],
  highlights: {
    before: [{ pageIndex: 0, top: 10 }],
    after: [{ pageIndex: 1, top: 20 }],
  },
  summary: { added: 1, removed: 1, modified: 1, similarity: 87, wordsBefore: 10, wordsAfter: 12 },
  textLayerMissing: false,
};

const renderCompare = (doc1 = docBefore, doc2 = docAfter) =>
  renderHook(({ a, b }) => useDocumentCompare(a, b), { initialProps: { a: doc1, b: doc2 } });

describe("useDocumentCompare", () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    comparePdfDocuments.mockResolvedValue(comparison);
    getCommentsByDocument.mockResolvedValue([]);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    vi.clearAllMocks();
  });

  test("compara los dos archivos al montar y expone el resultado y la similitud", async () => {
    const { result } = renderCompare();

    expect(result.current.canCompare).toBe(true);
    expect(result.current.loading).toBe(true);
    expect(result.current.result).toBeNull();
    expect(result.current.similarity).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(comparePdfDocuments).toHaveBeenCalledTimes(1);
    expect(comparePdfDocuments).toHaveBeenCalledWith(
      "http://api.test/uploads/v1.pdf",
      "http://api.test/uploads/v2.pdf"
    );
    expect(result.current.result).toBe(comparison);
    expect(result.current.similarity).toBe(87);
    expect(result.current.hasResult).toBe(true);
    expect(result.current.showDiffOverlay).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.hunks).toHaveLength(3);
  });

  test("describe cada panel con título, versión, url y el registro de scroll", async () => {
    const { result } = renderCompare();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const [before, after] = result.current.panes;
    expect(before).toMatchObject({
      side: "before",
      title: "Tesis",
      version: 1,
      url: "http://api.test/uploads/v1.pdf",
    });
    expect(after).toMatchObject({
      side: "after",
      title: "Tesis",
      version: 2,
      url: "http://api.test/uploads/v2.pdf",
    });
    expect(typeof before.onScrollerReady).toBe("function");
    expect(typeof after.onScrollerReady).toBe("function");
  });

  test("mezcla los comentarios de cada versión con los resaltados del diff", async () => {
    getCommentsByDocument.mockImplementation(async (id) => [
      {
        id: id * 10,
        attributes: {
          correction: `Comentario ${id}`,
          highlightAreas: JSON.stringify([{ pageIndex: 0, top: 5 }]),
          quote: "cita",
        },
      },
    ]);

    const { result } = renderCompare();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.panes[0].notes).toHaveLength(2));

    expect(getCommentsByDocument).toHaveBeenCalledWith(1);
    expect(getCommentsByDocument).toHaveBeenCalledWith(2);

    const [before, after] = result.current.panes;
    expect(before.notes[0]).toEqual({
      id: 10,
      content: "Comentario 1",
      highlightAreas: [{ pageIndex: 0, top: 5 }],
      quote: "cita",
    });
    expect(before.notes[1]).toMatchObject({
      id: -1,
      readOnly: true,
      color: HIGHLIGHT_COLORS.removed,
      highlightAreas: [{ pageIndex: 0, top: 10 }],
    });
    expect(after.notes[1]).toMatchObject({
      id: -1,
      readOnly: true,
      color: HIGHLIGHT_COLORS.added,
      highlightAreas: [{ pageIndex: 1, top: 20 }],
    });
  });

  test("filtra los cambios por tipo y vuelve a 'all' al cambiar de par", async () => {
    const { result, rerender } = renderCompare();
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setFilter("added"));
    expect(result.current.filter).toBe("added");
    expect(result.current.visibleHunks).toEqual([{ type: "added", page: 2 }]);

    const docNext = makeDoc(3, { title: "Tesis", version: 3, url: "/uploads/v3.pdf" });
    rerender({ a: docAfter, b: docNext });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filter).toBe("all");
    expect(result.current.visibleHunks).toHaveLength(3);
    expect(comparePdfDocuments).toHaveBeenLastCalledWith(
      "http://api.test/uploads/v2.pdf",
      "http://api.test/uploads/v3.pdf"
    );
  });

  test("goToPage guarda la página y salta a la vista lado a lado", async () => {
    const { result } = renderCompare();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tab).toBe("changes");
    expect(result.current.targetPage).toBeNull();

    act(() => result.current.goToPage(4));

    expect(result.current.tab).toBe("side-by-side");
    expect(result.current.targetPage).toBe(4);
  });

  test("expone el error, lo loguea y permite reintentar con runComparison", async () => {
    const failure = new Error("PDF corrupto");
    comparePdfDocuments.mockRejectedValueOnce(failure).mockResolvedValueOnce(comparison);

    const { result } = renderCompare();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(failure);
    expect(result.current.result).toBeNull();
    expect(result.current.similarity).toBeNull();
    expect(result.current.hasResult).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith("Error comparando documentos:", failure);

    await act(async () => {
      await result.current.runComparison();
    });

    expect(comparePdfDocuments).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.similarity).toBe(87);
  });

  test("sin capa de texto no hay resultado utilizable ni resaltados", async () => {
    comparePdfDocuments.mockResolvedValue({ hunks: [], summary: null, textLayerMissing: true });

    const { result } = renderCompare();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.result.textLayerMissing).toBe(true);
    expect(result.current.hasResult).toBe(false);
    expect(result.current.showDiffOverlay).toBe(false);
    expect(result.current.similarity).toBeNull();
    expect(result.current.panes[0].notes).toEqual([]);
  });

  test("no compara cuando falta el archivo de alguna versión", async () => {
    const withoutFile = makeDoc(2, { title: "Tesis", version: 2 });

    const { result } = renderCompare(docBefore, withoutFile);

    expect(result.current.canCompare).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(comparePdfDocuments).not.toHaveBeenCalled();
  });

  test("descarta el resultado de una comparación antigua que termina tarde", async () => {
    let resolveFirst;
    comparePdfDocuments
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce(comparison);

    const { result, rerender } = renderCompare();
    expect(result.current.loading).toBe(true);

    const docNext = makeDoc(3, { title: "Tesis", version: 3, url: "/uploads/v3.pdf" });
    rerender({ a: docAfter, b: docNext });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.similarity).toBe(87);

    const stale = { ...comparison, summary: { ...comparison.summary, similarity: 1 } };
    await act(async () => {
      resolveFirst(stale);
    });

    expect(result.current.result).toBe(comparison);
    expect(result.current.similarity).toBe(87);
  });
});
