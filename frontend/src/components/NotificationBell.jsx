import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Select } from "./ui/Input";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreference,
  updateNotificationPreference,
} from "../core/Notification";
import { errorAlert } from "./Alerts/Alerts";
import { formatDateTime } from "../utils/format";

// Tecnología elegida: polling cada 30s (simple, compatible con la
// autenticación JWT existente y suficiente para el volumen de la app)
export const POLL_INTERVAL_MS = 30000;

const TYPE_LABELS = {
  document_uploaded: "Documento subido",
  status_changed: "Cambio de estado",
  comment_received: "Nuevo comentario",
  general: "Notificación",
};

const PREFERENCE_OPTIONS = [
  { value: "in_app", label: "Solo en la aplicación" },
  { value: "email", label: "Solo por correo" },
  { value: "both", label: "Correo y aplicación" },
];

const dropdownVariants = {
  closed: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [preference, setPreference] = useState("both");
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const intervalId = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    getNotificationPreference()
      .then((value) => value && setPreference(value))
      .catch((error) =>
        console.error("Error al cargar preferencia de notificaciones:", error)
      );
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item
          )
        );
      }

      setIsOpen(false);

      const documentId = notification.documents?.[0]?.id;
      if (documentId) {
        navigate(`/document/${documentId}`);
      }
    } catch (error) {
      console.error("Error al marcar la notificación como leída:", error);
      errorAlert("Error al procesar la notificación");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
      errorAlert("Error al marcar las notificaciones como leídas");
    }
  };

  const handlePreferenceChange = async (event) => {
    const newPreference = event.target.value;
    const previousPreference = preference;
    setPreference(newPreference);

    try {
      await updateNotificationPreference(newPreference);
    } catch (error) {
      console.error("Error al actualizar la preferencia:", error);
      setPreference(previousPreference);
      errorAlert("Error al guardar la preferencia de notificaciones");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        className="relative rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-content"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
            className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold tabular text-white"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={dropdownVariants}
            className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-line bg-surface shadow-pop"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <span className="text-sm font-medium text-content">Notificaciones</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-accent transition-colors hover:text-accent-soft"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 p-2">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      notification.isRead
                        ? "border-line bg-surface hover:bg-surface-2"
                        : "border-accent-wash bg-accent-wash"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {TYPE_LABELS[notification.type] || TYPE_LABELS.general}
                    </p>
                    <p className="mt-0.5 text-sm text-content">{notification.message}</p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </motion.div>
                ))
              ) : (
                <p className="px-2 py-6 text-center text-sm text-muted">
                  No hay notificaciones.
                </p>
              )}
            </div>

            <div className="border-t border-line px-4 py-3">
              <Select
                id="notification-preference"
                label="Preferencia de notificaciones"
                value={preference}
                onChange={handlePreferenceChange}
              >
                {PREFERENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
