import { useEffect, useState } from "react";

/**
 * Tema activo de la aplicación.
 *
 * El tema vive como clase en <html> (lo pinta el script de index.html y lo
 * cambia ThemeToggle), así que se observa esa clase en lugar de duplicar el
 * estado. Lo necesitan los componentes de terceros que traen su propio tema y
 * no leen nuestros tokens, como el visor de PDF.
 */
const readTheme = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

export const useAppTheme = () => {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()));

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
};

export default useAppTheme;
