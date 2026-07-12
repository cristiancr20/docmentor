import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreference,
  updateNotificationPreference,
} from "../core/Notification";
import { errorAlert } from "./Alerts/Alerts";

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
      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        aria-label="Notificaciones"
        className="flex p-2 items-center space-x-2 bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <FaBell className="text-yellow-500" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={dropdownVariants}
            className="absolute right-0 mt-2 w-80 p-2 max-h-96 overflow-y-auto bg-white rounded-lg shadow dark:bg-gray-700 z-50"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg mt-2 cursor-pointer ${
                    notification.isRead
                      ? "bg-gray-900 text-white"
                      : "bg-blue-100 text-gray-900"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {TYPE_LABELS[notification.type] || TYPE_LABELS.general}
                  </p>
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="p-3 text-sm text-gray-700 dark:text-gray-400">
                No hay notificaciones.
              </p>
            )}

            <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2 px-2 pb-1">
              <label
                htmlFor="notification-preference"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >
                Preferencia de notificaciones
              </label>
              <select
                id="notification-preference"
                value={preference}
                onChange={handlePreferenceChange}
                className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-1.5"
              >
                {PREFERENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
