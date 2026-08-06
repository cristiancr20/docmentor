import { navItemsFor, NAV_BY_ROLE } from "../layout/navigation";

/**
 * La navegación se deriva del rol, igual que las rutas protegidas de App.js.
 * Antes se derivaba de permisos sueltos, y eso permitía desajustes: coordinador
 * tenía acceso a /audit-logs pero ningún enlace para llegar.
 */
describe("navItemsFor", () => {
  it("devuelve los enlaces del estudiante", () => {
    const paths = navItemsFor(["estudiante"]).map((item) => item.to);

    expect(paths).toEqual(["/student/dashboard", "/student/projects/view"]);
  });

  it("da al coordinador acceso a la auditoría", () => {
    const paths = navItemsFor(["coordinador"]).map((item) => item.to);

    expect(paths).toContain("/audit-logs");
  });

  it("no muestra enlaces de otros roles", () => {
    const paths = navItemsFor(["estudiante"]).map((item) => item.to);

    expect(paths).not.toContain("/admin/dashboard");
    expect(paths).not.toContain("/audit-logs");
  });

  it("no repite enlaces cuando el usuario tiene varios roles", () => {
    const paths = navItemsFor(["superadmin", "coordinador"]).map((item) => item.to);

    expect(new Set(paths).size).toBe(paths.length);
  });

  it("devuelve una lista vacía si no hay roles", () => {
    expect(navItemsFor([])).toEqual([]);
    expect(navItemsFor(undefined)).toEqual([]);
  });

  it("cada enlace declara ruta, etiqueta e icono", () => {
    Object.values(NAV_BY_ROLE)
      .flat()
      .forEach((item) => {
        expect(item.to).toEqual(expect.any(String));
        expect(item.label).toEqual(expect.any(String));
        expect(item.icon).toBeDefined();
      });
  });
});
