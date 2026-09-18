import { useCallback, useEffect, useRef, useState } from "react";
import logger from "../utils/logger";

// Errores de cancelación: axios rechaza con CanceledError y fetch con AbortError.
const isCanceled = (err) => err?.name === "CanceledError" || err?.name === "AbortError";

/**
 * Encapsula la carga de proyectos que repetían los dashboards: el trío
 * projects/loading/error y el useEffect inicial.
 *
 * `loader({ signal })` es una función async que devuelve la lista de proyectos.
 * Puede hacer más trabajo por el camino (p.ej. cargar documentos derivados);
 * `loading` se mantiene en true hasta que la promesa termina.
 *
 * `deps` relanza la carga cuando cambia (como un useEffect). `reload()` la
 * relanza a mano. La última carga en curso se aborta al desmontar o al lanzar
 * otra, y su resultado se descarta para no hacer setState fuera de tiempo.
 */
export default function useProjects(loader, deps = []) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Se lee en el efecto para no relanzar la carga cada vez que el dashboard
  // recrea la función del loader en un render.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await loaderRef.current({ signal });
        if (signal.aborted) return;
        setProjects(data ?? []);
      } catch (err) {
        if (signal.aborted || isCanceled(err)) return;
        logger.error("Error fetching dashboard data:", err);
        setError(err);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [...deps, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { projects, loading, error, reload, setProjects };
}
