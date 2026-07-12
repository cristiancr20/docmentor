import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../Navbar";
import { usePermission } from "../../context/PermissionContext";
import {
  getMyNotifications,
  getNotificationPreference,
} from "../../core/Notification";
import { decryptData } from "../../utils/encryption";

jest.mock("../../context/PermissionContext", () => ({
  usePermission: jest.fn(),
}));

jest.mock("../../core/Notification", () => ({
  getMyNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  getNotificationPreference: jest.fn(),
  updateNotificationPreference: jest.fn(),
}));

jest.mock("../../utils/encryption", () => ({
  decryptData: jest.fn(),
}));

const mockPermissions = (permissions) => {
  usePermission.mockReturnValue({
    permissions,
    hasPermission: (code) => permissions.includes(code),
    loading: false,
    error: null,
  });
};

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

describe("Navbar permisos", () => {
  beforeEach(() => {
    // CRA resetea los mocks entre tests: configurar implementaciones aquí
    localStorage.getItem.mockImplementation((key) => {
      if (key === "jwtToken") return "encrypted-token";
      if (key === "userData") return "encrypted-user";
      return null;
    });
    decryptData.mockImplementation((value) =>
      value === "encrypted-token"
        ? "jwt-token"
        : JSON.stringify({ username: "Usuario Test", email: "test@unl.edu.ec" })
    );
    getMyNotifications.mockResolvedValue([]);
    getNotificationPreference.mockResolvedValue("both");
  });

  it("muestra el menu de revision con REVIEW_DOCUMENT", async () => {
    mockPermissions(["REVIEW_DOCUMENT", "COMMENT_DOCUMENT"]);
    renderNavbar();

    expect(
      await screen.findByText("Ver proyectos asignados")
    ).toBeInTheDocument();
    expect(screen.queryByText("Ver mis proyectos")).not.toBeInTheDocument();
  });

  it("muestra el menu de estudiante con CREATE_PROJECT y sin REVIEW_DOCUMENT", async () => {
    mockPermissions(["CREATE_PROJECT", "CREATE_DOCUMENT"]);
    renderNavbar();

    expect(await screen.findByText("Ver mis proyectos")).toBeInTheDocument();
    expect(
      screen.queryByText("Ver proyectos asignados")
    ).not.toBeInTheDocument();
  });

  it("no muestra menus de navegacion sin permisos", async () => {
    mockPermissions(["VIEW_PROJECT"]);
    renderNavbar();

    expect(await screen.findByText("Usuario Test")).toBeInTheDocument();
    expect(
      screen.queryByText("Ver proyectos asignados")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ver mis proyectos")).not.toBeInTheDocument();
  });
});
