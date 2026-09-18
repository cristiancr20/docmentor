import React from "react";
import { act, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";

const SESSION_KEYS = ["userData", "jwtToken", "userPermissions", "strapiUserId"];

const Consumer = () => {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <span>cargando</span>;
  return (
    <div>
      <span data-testid="user">{user ? `${user.email}|${user.token}` : "sin sesión"}</span>
      <button onClick={() => login({ id: 1, email: "ana@test.com", rol: "tutor" }, "jwt-1")}>
        entrar
      </button>
      <button onClick={logout}>salir</button>
    </div>
  );
};

const renderAuth = () =>
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );

describe("AuthContext (sesión en localStorage)", () => {
  let consoleError;

  // jest-localstorage-mock expone jest.fn() y CRA los resetea antes de cada
  // test (resetMocks), así que se respaldan con un almacén en memoria.
  beforeEach(() => {
    const store = new Map();
    localStorage.getItem.mockImplementation((key) => store.get(key) ?? null);
    localStorage.setItem.mockImplementation((key, value) => store.set(key, String(value)));
    localStorage.removeItem.mockImplementation((key) => store.delete(key));
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("guarda la sesión como JSON plano y la borra entera al salir", () => {
    renderAuth();

    act(() => screen.getByText("entrar").click());

    expect(JSON.parse(localStorage.getItem("userData"))).toEqual({
      id: 1,
      email: "ana@test.com",
      rol: "tutor",
      rols: ["tutor"],
    });
    expect(localStorage.getItem("jwtToken")).toBe("jwt-1");
    expect(screen.getByTestId("user")).toHaveTextContent("ana@test.com|jwt-1");

    localStorage.setItem("userPermissions", "[]");
    localStorage.setItem("strapiUserId", "1");
    act(() => screen.getByText("salir").click());

    SESSION_KEYS.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
    expect(screen.getByTestId("user")).toHaveTextContent("sin sesión");
  });

  it("rehidrata la sesión guardada al recargar", () => {
    localStorage.setItem("userData", JSON.stringify({ id: 2, email: "luis@test.com", rols: ["estudiante"] }));
    localStorage.setItem("jwtToken", "jwt-2");

    renderAuth();

    expect(screen.getByTestId("user")).toHaveTextContent("luis@test.com|jwt-2");
  });

  it("descarta una sesión antigua cifrada sin errores en consola", () => {
    // Formato que dejaba CryptoJS.AES.encrypt: base64 con prefijo "Salted__".
    localStorage.setItem("userData", "U2FsdGVkX1+abc123/notjson==");
    localStorage.setItem("jwtToken", "U2FsdGVkX1+def456/notjson==");
    localStorage.setItem("userPermissions", "[]");
    localStorage.setItem("strapiUserId", "1");

    renderAuth();

    expect(screen.getByTestId("user")).toHaveTextContent("sin sesión");
    SESSION_KEYS.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
    expect(consoleError).not.toHaveBeenCalled();
  });
});
