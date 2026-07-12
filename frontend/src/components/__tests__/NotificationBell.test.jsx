import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NotificationBell from "../NotificationBell";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreference,
  updateNotificationPreference,
} from "../../core/Notification";

jest.mock("../../core/Notification", () => ({
  getMyNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  getNotificationPreference: jest.fn(),
  updateNotificationPreference: jest.fn(),
}));

const buildNotification = (overrides = {}) => ({
  id: 1,
  message: "Nuevo documento subido: \"Tesis v1\"",
  type: "document_uploaded",
  isRead: false,
  createdAt: "2026-07-10T12:00:00.000Z",
  documents: [{ id: 42, title: "Tesis v1" }],
  ...overrides,
});

const renderBell = () =>
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );

describe("NotificationBell", () => {
  beforeEach(() => {
    // CRA resetea los mocks entre tests: configurar implementaciones aquí
    getMyNotifications.mockResolvedValue([]);
    getNotificationPreference.mockResolvedValue("both");
    markNotificationAsRead.mockResolvedValue({});
    markAllNotificationsAsRead.mockResolvedValue({});
    updateNotificationPreference.mockResolvedValue({});
  });

  it("muestra el contador de notificaciones no leídas", async () => {
    getMyNotifications.mockResolvedValue([
      buildNotification(),
      buildNotification({ id: 2, isRead: true }),
    ]);
    renderBell();

    expect(await screen.findByText("1")).toBeInTheDocument();
  });

  it("lista las notificaciones al abrir el dropdown", async () => {
    getMyNotifications.mockResolvedValue([buildNotification()]);
    renderBell();

    await screen.findByText("1");
    await userEvent.click(screen.getByLabelText("Notificaciones"));

    expect(
      await screen.findByText('Nuevo documento subido: "Tesis v1"')
    ).toBeInTheDocument();
  });

  it("marca una notificación como leída al hacer clic", async () => {
    getMyNotifications.mockResolvedValue([buildNotification()]);
    renderBell();

    await screen.findByText("1");
    await userEvent.click(screen.getByLabelText("Notificaciones"));
    await userEvent.click(
      await screen.findByText('Nuevo documento subido: "Tesis v1"')
    );

    await waitFor(() => expect(markNotificationAsRead).toHaveBeenCalledWith(1));
  });

  it("marca todas las notificaciones como leídas", async () => {
    getMyNotifications.mockResolvedValue([
      buildNotification(),
      buildNotification({ id: 2 }),
    ]);
    renderBell();

    await screen.findByText("2");
    await userEvent.click(screen.getByLabelText("Notificaciones"));
    await userEvent.click(
      await screen.findByText("Marcar todas como leídas")
    );

    await waitFor(() => expect(markAllNotificationsAsRead).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByText("2")).not.toBeInTheDocument()
    );
  });

  it("actualiza la preferencia de notificaciones", async () => {
    renderBell();

    await userEvent.click(screen.getByLabelText("Notificaciones"));
    const select = await screen.findByLabelText(
      "Preferencia de notificaciones"
    );
    await userEvent.selectOptions(select, "email");

    await waitFor(() =>
      expect(updateNotificationPreference).toHaveBeenCalledWith("email")
    );
  });

  it("muestra mensaje vacío cuando no hay notificaciones", async () => {
    renderBell();

    await userEvent.click(screen.getByLabelText("Notificaciones"));

    expect(await screen.findByText("No hay notificaciones.")).toBeInTheDocument();
  });
});
