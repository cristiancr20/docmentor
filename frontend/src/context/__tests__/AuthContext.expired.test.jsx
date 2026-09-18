import React from "react";
import { act, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import api, { AUTH_EXPIRED_EVENT } from "../../core/apiClient";

const SESSION_KEYS = ["userData", "jwtToken", "userPermissions", "strapiUserId"];

const Consumer = () => {
  const { user, loading } = useAuth();
  if (loading) return <span>cargando</span>;
  return <span data-testid="user">{user ? user.email : "sin sesión"}</span>;
};

// Adaptador de axios que responde siempre con el estado indicado, sin red.
const respondWith = (status) => (config) => {
  const response = { status, statusText: String(status), headers: {}, config, data: {} };
  if (status < 400) return Promise.resolve(response);
  return Promise.reject(Object.assign(new Error(`Request failed with status code ${status}`), {
    config,
    response,
  }));
};

const seedSession = () => {
  localStorage.setItem("userData", JSON.stringify({ id: 1, email: "ana@test.com", rols: ["tutor"] }));
  localStorage.setItem("jwtToken", "jwt-1");
  localStorage.setItem("userPermissions", "[]");
  localStorage.setItem("strapiUserId", "1");
};

describe("Sesión expirada (401 del backend)", () => {
  let onExpired;

  beforeEach(() => {
    const store = new Map();
    localStorage.getItem.mockImplementation((key) => store.get(key) ?? null);
    localStorage.setItem.mockImplementation((key, value) => store.set(key, String(value)));
    localStorage.removeItem.mockImplementation((key) => store.delete(key));
    onExpired = jest.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
  });

  afterEach(() => {
    window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  });

  it("un 401 limpia localStorage y emite auth:expired", async () => {
    seedSession();

    await expect(api.get("/api/projects", { adapter: respondWith(401) })).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(onExpired).toHaveBeenCalledTimes(1);
    SESSION_KEYS.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
  });

  it("un 401 del propio login no cierra la sesión", async () => {
    seedSession();

    await expect(api.post("/api/auth/local", {}, { adapter: respondWith(401) })).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(onExpired).not.toHaveBeenCalled();
    expect(localStorage.getItem("jwtToken")).toBe("jwt-1");
  });

  it("otros errores no tocan la sesión", async () => {
    seedSession();

    await expect(api.get("/api/projects", { adapter: respondWith(500) })).rejects.toMatchObject({
      response: { status: 500 },
    });

    expect(onExpired).not.toHaveBeenCalled();
    expect(localStorage.getItem("jwtToken")).toBe("jwt-1");
  });

  it("AuthProvider deja user en null cuando llega el 401", async () => {
    seedSession();
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    expect(screen.getByTestId("user")).toHaveTextContent("ana@test.com");

    await act(async () => {
      await api.get("/api/projects", { adapter: respondWith(401) }).catch(() => {});
    });

    expect(screen.getByTestId("user")).toHaveTextContent("sin sesión");
  });

  it("deja de escuchar auth:expired al desmontarse", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(AUTH_EXPIRED_EVENT, expect.any(Function));
    removeSpy.mockRestore();
  });
});
