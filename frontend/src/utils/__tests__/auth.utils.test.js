import { ROLE_ROUTES } from "../auth.utils";

describe("ROLE_ROUTES", () => {
  it("define una ruta para cada rol de la aplicación", () => {
    expect(Object.keys(ROLE_ROUTES).sort()).toEqual(
      ["coordinador", "estudiante", "superadmin", "tutor"]
    );
  });

  it("cada ruta es un path absoluto", () => {
    Object.values(ROLE_ROUTES).forEach((route) => {
      expect(route).toMatch(/^\/[a-z-]+\/dashboard$/);
    });
  });
});
