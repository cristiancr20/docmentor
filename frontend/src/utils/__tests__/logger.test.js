import logger from "../logger";

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;
  let logSpy;
  let infoSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  describe("en production", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("debug no llama a console.log", () => {
      logger.debug("mensaje", { a: 1 });
      expect(logSpy).not.toHaveBeenCalled();
    });

    it("info no llama a console.info", () => {
      logger.info("mensaje");
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it("warn sigue llamando a console.warn", () => {
      logger.warn("aviso", 42);
      expect(warnSpy).toHaveBeenCalledWith("aviso", 42);
    });

    it("error sigue llamando a console.error", () => {
      const err = new Error("boom");
      logger.error("fallo", err);
      expect(errorSpy).toHaveBeenCalledWith("fallo", err);
    });
  });

  describe("en development", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("debug llama a console.log con los mismos argumentos", () => {
      logger.debug("mensaje", { a: 1 });
      expect(logSpy).toHaveBeenCalledWith("mensaje", { a: 1 });
    });

    it("info llama a console.info", () => {
      logger.info("mensaje");
      expect(infoSpy).toHaveBeenCalledWith("mensaje");
    });

    it("warn llama a console.warn", () => {
      logger.warn("aviso");
      expect(warnSpy).toHaveBeenCalledWith("aviso");
    });

    it("error llama a console.error", () => {
      logger.error("fallo");
      expect(errorSpy).toHaveBeenCalledWith("fallo");
    });
  });
});
