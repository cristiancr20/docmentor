/**
 * Logger de frontend.
 *
 * Había más de ochenta `console.*` sueltos que llegaban tal cual al navegador
 * del usuario final. Este módulo los centraliza: `debug` e `info` se silencian
 * en producción, mientras que `warn` y `error` siguen saliendo por consola
 * porque sí aportan al diagnosticar un fallo en el entorno del usuario.
 *
 * La comprobación de entorno se hace en cada llamada (no al cargar el módulo)
 * para que los tests puedan alternar NODE_ENV sin reimportar el módulo.
 */

const isProduction = () => process.env.NODE_ENV === "production";

const debug = (...args) => {
  if (isProduction()) return;
  console.log(...args);
};

const info = (...args) => {
  if (isProduction()) return;
  console.info(...args);
};

const warn = (...args) => {
  console.warn(...args);
};

const error = (...args) => {
  console.error(...args);
};

const logger = { debug, info, warn, error };

export default logger;
