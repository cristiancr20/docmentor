import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowDown, FaBell, FaBars, FaTimes } from "react-icons/fa";
import { getNotifications, markAsReadNotification } from "../core/Notification";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("rol");
    const name = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    setUserRole(role);
    setUserName(name);
    setUserEmail(email);

    if (role === "tutor") {
      const token = localStorage.getItem("jwtToken");
      if (token) {
        getNotifications(token)
          .then((data) => setNotifications(data))
          .catch((error) =>
            console.error("Error al cargar notificaciones:", error)
          );
      } else {
        console.error("Token JWT no encontrado");
      }
    }
  }, []);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNotificationToggle = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const markAsRead = async (notification) => {
    const notificationId = notification.id;
    const documentData = notification.attributes.document?.data;

    try {
      await markAsReadNotification(notificationId);

      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                attributes: { ...notification.attributes, leido: true },
              }
            : notification
        )
      );
      if (documentData) {
        const documentId = documentData.id;
        navigate(`/documento/${documentId}`);
      } else {
        console.warn("No hay documento asociado a la notificación");
      }
    } catch (error) {
      console.error(
        "Error al marcar la notificación como leída:",
        error.response || error.message
      );
    }
  };

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.attributes.leido
  ).length;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/", { replace: true });
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    open: {
      opacity: 1,
      height: "auto",
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const dropdownVariants = {
    closed: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="relative">
      {/* Barra de navegación principal */}
      <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="max-w-screen-xl flex items-center justify-between mx-auto p-4">
          <div className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            {/* Texto abreviado en dispositivos pequeños */}
            <span className="block sm:hidden">DocT</span>

            {/* Texto completo en pantallas medianas o mayores */}
            <span className="hidden sm:block">DocuTrack</span>
          </div>

          {/* Menú de escritorio */}
          <div className="hidden md:flex md:items-center ">
            <ul className="font-medium flex items-center space-x-8 ">
              {userRole === "tutor" && (
                <>
                  <motion.li whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/tutor/dashboard"
                      className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500"
                    >
                      Inicio
                    </Link>
                  </motion.li>
                  <motion.li whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/proyectos/asignados"
                      className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500"
                    >
                      Proyectos asignados
                    </Link>
                  </motion.li>
                </>
              )}

              {userRole === "estudiante" && (
                <>
                  <motion.li whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/student/dashboard"
                      className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500"
                    >
                      Inicio
                    </Link>
                  </motion.li>
                  <motion.li whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/proyecto/ver"
                      className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500"
                    >
                      Ver mis Proyectos
                    </Link>
                  </motion.li>
                </>
              )}
            </ul>
          </div>

          <div className="flex items-center space-x-3">
            {/* Botón de menú móvil */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="text-gray-500 dark:text-gray-300 md:hidden focus:outline-none"
            >
              {isNavOpen ? <FaTimes /> : <FaBars />}
            </motion.button>

            {/* Notificaciones y perfil */}
            <div className="flex items-center space-x-3">
              {userRole === "tutor" && (
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="flex p-2 items-center space-x-2 bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                    onClick={handleNotificationToggle}
                  >
                    <FaBell className="text-yellow-500" />
                    {unreadNotificationsCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full"
                      >
                        {unreadNotificationsCount}
                      </motion.span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={dropdownVariants}
                        className="absolute right-0 mt-2 w-80 p-2 max-h-96 overflow-y-auto bg-white rounded-lg shadow dark:bg-gray-700"
                      >
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.02 }}
                              className={`p-3 rounded-lg mt-2 cursor-pointer ${
                                notification.attributes.leido
                                  ? "bg-gray-900 text-white"
                                  : "bg-blue-100 text-gray-900"
                              }`}
                              onClick={() => markAsRead(notification)}
                            >
                              <p className="text-sm">
                                {notification.attributes.mensaje}
                              </p>
                            </motion.div>
                          ))
                        ) : (
                          <p className="p-3 text-sm text-gray-700 dark:text-gray-400">
                            No hay notificaciones.
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="flex p-2 items-center space-x-2 bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                  onClick={handleDropdownToggle}
                >
                  <span className="text-white">{userName}</span>
                  <motion.div
                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaArrowDown className="text-white" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial="closed"
                      animate="open"
                      exit="closed"
                      variants={dropdownVariants}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow dark:bg-gray-700"
                    >
                      <div className="px-4 py-3">
                        <span className="block text-sm text-gray-900 dark:text-white">
                          {userName}
                        </span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">
                          {userEmail}
                        </span>
                      </div>
                      <ul className="py-2">
                        <motion.li whileHover={{ scale: 1.02 }}>
                          <button
                            onClick={handleLogout}
                            className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Cerrar sesión
                          </button>
                        </motion.li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Menú móvil */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="absolute w-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl md:hidden z-50 rounded-b-2xl border-b border-x border-gray-200 dark:border-gray-700"
          >
            <motion.div
              className="w-16 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-2"
              initial={{ width: "2rem" }}
              animate={{ width: "4rem" }}
              transition={{ duration: 0.3 }}
            />

            <ul className="flex flex-col p-6 space-y-2">
              {userRole === "tutor" && (
                <>
                  <motion.li
                    whileHover={{ scale: 1.02, x: 10 }}
                    className="overflow-hidden rounded-xl"
                  >
                    <Link
                      to="/tutor/dashboard"
                      className="flex items-center p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => setIsNavOpen(false)}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                      <span className="font-medium">Inicio</span>
                    </Link>
                  </motion.li>
                  <motion.li
                    whileHover={{ scale: 1.02, x: 10 }}
                    className="overflow-hidden rounded-xl"
                  >
                    <Link
                      to="/proyectos/asignados"
                      className="flex items-center p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => setIsNavOpen(false)}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                      <span className="font-medium">Proyectos asignados</span>
                    </Link>
                  </motion.li>
                </>
              )}

              {userRole === "estudiante" && (
                <>
                  <motion.li
                    whileHover={{ scale: 1.02, x: 10 }}
                    className="overflow-hidden rounded-xl"
                  >
                    <Link
                      to="/student/dashboard"
                      className="flex items-center p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => setIsNavOpen(false)}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                      <span className="font-medium">Inicio</span>
                    </Link>
                  </motion.li>
                  <motion.li
                    whileHover={{ scale: 1.02, x: 10 }}
                    className="overflow-hidden rounded-xl"
                  >
                    <Link
                      to="/proyecto/ver"
                      className="flex items-center p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => setIsNavOpen(false)}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                      <span className="font-medium">Ver mis Proyectos</span>
                    </Link>
                  </motion.li>
                </>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Navbar;
