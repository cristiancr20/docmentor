import { act, renderHook, waitFor } from "@testing-library/react";
import useProjects from "../useProjects";

const projectsA = [{ id: 1, title: "Proyecto A" }];
const projectsB = [{ id: 2, title: "Proyecto B" }];

describe("useProjects", () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test("empieza cargando y expone los proyectos cuando el loader resuelve", async () => {
    const loader = jest.fn().mockResolvedValue(projectsA);

    const { result } = renderHook(() => useProjects(loader));

    expect(result.current.loading).toBe(true);
    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.projects).toEqual(projectsA);
    expect(result.current.error).toBeNull();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
  });

  test("trata un loader que no devuelve nada como lista vacía", async () => {
    const loader = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useProjects(loader));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projects).toEqual([]);
  });

  test("expone el error, lo loguea y deja de cargar cuando el loader falla", async () => {
    const failure = new Error("Tutor no encontrado");
    const loader = jest.fn().mockRejectedValue(failure);

    const { result } = renderHook(() => useProjects(loader));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(failure);
    expect(result.current.projects).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith("Error fetching dashboard data:", failure);
  });

  test("reload vuelve a llamar al loader, limpia el error y actualiza los proyectos", async () => {
    const loader = jest
      .fn()
      .mockRejectedValueOnce(new Error("fallo temporal"))
      .mockResolvedValueOnce(projectsB);

    const { result } = renderHook(() => useProjects(loader));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => {
      result.current.reload();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(loader).toHaveBeenCalledTimes(2);
    expect(result.current.projects).toEqual(projectsB);
    expect(result.current.error).toBeNull();
  });

  test("relanza la carga cuando cambian las deps", async () => {
    const loader = jest.fn().mockResolvedValueOnce(projectsA).mockResolvedValueOnce(projectsB);

    const { result, rerender } = renderHook(({ email }) => useProjects(loader, [email]), {
      initialProps: { email: "a@test.com" },
    });

    await waitFor(() => expect(result.current.projects).toEqual(projectsA));

    rerender({ email: "b@test.com" });

    await waitFor(() => expect(result.current.projects).toEqual(projectsB));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  test("aborta la carga al desmontar y descarta su resultado", async () => {
    let resolveLoader;
    let receivedSignal;
    const loader = jest.fn(({ signal }) => {
      receivedSignal = signal;
      return new Promise((resolve) => {
        resolveLoader = resolve;
      });
    });

    const { result, unmount } = renderHook(() => useProjects(loader));

    expect(result.current.loading).toBe(true);
    expect(receivedSignal.aborted).toBe(false);

    unmount();

    expect(receivedSignal.aborted).toBe(true);

    await act(async () => {
      resolveLoader(projectsA);
    });

    // Sin setState tras desmontar: ni warnings de React ni logger.error
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("ignora los errores de cancelación sin loguearlos", async () => {
    const loader = jest.fn(({ signal }) =>
      new Promise((_, reject) => {
        signal.addEventListener("abort", () => {
          const err = new Error("canceled");
          err.name = "CanceledError";
          reject(err);
        });
      })
    );

    const { unmount } = renderHook(() => useProjects(loader));

    await act(async () => {
      unmount();
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
