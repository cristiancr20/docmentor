import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "docmentor-theme";

const readTheme = () => {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

/**
 * Alterna claro/oscuro.
 *
 * La clase inicial la pinta un script en index.html antes del primer render,
 * así que aquí solo se lee el estado ya aplicado: no hay destello al cargar.
 */
const ThemeToggle = ({ onDark = false }) => {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Modo privado o almacenamiento lleno: el tema simplemente no persiste.
    }
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
      className={[
        "grid h-9 w-9 place-items-center rounded-lg transition-colors",
        onDark
          ? "text-dark-muted hover:bg-dark-surface-2 hover:text-dark-content"
          : "text-muted hover:bg-surface-2 hover:text-content",
      ].join(" ")}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.8} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />}
    </button>
  );
};

ThemeToggle.propTypes = {
  onDark: PropTypes.bool,
};

export default ThemeToggle;
