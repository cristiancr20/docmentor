import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowDown, FaBell, FaBars, FaTimes } from "react-icons/fa";
import { getNotifications, markAsReadNotification } from "../core/Notification";
import { decryptData } from "../utils/encryption";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Efecto para cargar las notificaciones (solo para tutores)
  useEffect(() => {
    const loadNotifications = async () => {
      if (userData?.rol === "tutor") {
        try {
          const response = await getNotifications(token);
          setNotifications(response.data || []);
        } catch (error) {
          console.error("Error al cargar notificaciones:", error);
        }
      }
    };

    if (userData) {
      loadNotifications();
    }
  }, [userData]);

  useEffect(() => {
    const encryptedToken = localStorage.getItem("jwtToken");
    const encryptedUserData = localStorage.getItem("userData");

    if (!encryptedToken || !encryptedUserData) {
      console.warn("Token o datos de usuario no encontrados en localStorage.");
      setIsLoading(false);
      return;
    }

    try {
      const jwtToken = decryptData(encryptedToken);
      const user = JSON.parse(decryptData(encryptedUserData));
      setUserData(user);
      setToken(jwtToken);
      setIsLoading(false);
    } catch (error) {
      console.error("Error al procesar los datos del usuario:", error.message);
      setError("Error al cargar los datos del usuario");
      setIsLoading(false);
    }
  }, []);


  const handleToggle = (setter) => () => setter((prev) => !prev);

  const markAsRead = async (notification) => {
    const notificationId = notification.id;
    const documentData = notification.attributes.document?.data;

    try {
      await markAsReadNotification(notificationId);

      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === notificationId
            ? {
                ...notif,
                attributes: { ...notif.attributes, isRead: true },
              }
            : notif
        )
      );

      if (documentData) {
        navigate(`/document/${documentData.id}`);
      }
    } catch (error) {
      console.error("Error al marcar la notificación como leída:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userData");
    navigate("/", { replace: true });
  };



  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[64px] bg-white dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-[64px] bg-white dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">No hay datos de usuario disponibles</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[64px] bg-white dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }


  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.attributes.isRead
  ).length;

  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      y: -20,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    open: {
      opacity: 1,
      height: "auto",
      y: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

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

  return (
    <div className="relative">
      <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="max-w-screen-xl flex items-center justify-between mx-auto p-4">
          <div className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            <span className="block sm:hidden">DocM</span>
            <span className="hidden sm:block">DocMentor</span>
          </div>

          <div className="hidden md:flex md:items-center">
            <ul className="font-medium flex items-center space-x-8">
              {userData ? (
                <>
                  {userData?.rol === "tutor" && (
                    <>
                      <motion.li whileHover={{ scale: 1.05 }}>
                        <Link
                          to="/tutor/dashboard"
                          className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500"
                        >
                          <span className="font-medium">Inicio</span>
                        </Link>
                      </motion.li>
                      <motion.li whileHover={{ scale: 1.05 }}>
                        <Link
                          to="/tutor/assigned-projects"
                          className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500"
                        >
                          <span className="font-medium">
                            Ver proyectos asignados
                          </span>
                        </Link>
                      </motion.li>
                    </>
                  )}

                  {userData?.rol === "estudiante" && (
                    <>
                      <motion.li whileHover={{ scale: 1.05 }}>
                        <Link
                          to="/student/dashboard"
                          className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500"
                        >
                          <span className="font-medium">Inicio</span>
                        </Link>
                      </motion.li>
                      <motion.li whileHover={{ scale: 1.05 }}>
                        <Link
                          to="/student/projects/view"
                          className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500"
                        >
                          <span className="font-medium">Ver mis proyectos</span>
                        </Link>
                      </motion.li>
                    </>
                  )}
                </>
              ) : (
                <motion.li whileHover={{ scale: 1.05 }}>
                  <span className="text-gray-900 dark:text-white">
                    Cargando...
                  </span>
                </motion.li>
              )}
            </ul>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="text-gray-500 dark:text-gray-300 md:hidden focus:outline-none"
            >
              {isNavOpen ? <FaTimes /> : <FaBars />}
            </motion.button>

            <div className="flex items-center space-x-3">
              {userData?.rol === "tutor" && (
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="flex p-2 items-center space-x-2 bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                    onClick={handleToggle(setIsNotificationOpen)}
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
                        className="absolute right-0 mt-2 w-80 p-2 max-h-96 overflow-y-auto bg-white rounded-lg shadow dark:bg-gray-700 z-50"
                      >
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.02 }}
                              className={`p-3 rounded-lg mt-2 cursor-pointer ${
                                notification.attributes.isRead
                                  ? "bg-gray-900 text-white"
                                  : "bg-blue-100 text-gray-900"
                              }`}
                              onClick={() => markAsRead(notification)}
                            >
                              <p className="text-sm">
                                {notification.attributes.message}
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
                  onClick={handleToggle(setIsDropdownOpen)}
                >
                  <span className="text-white">{userData?.username}</span>
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
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow dark:bg-gray-700 z-50"
                    >
                      <div className="px-4 py-3">
                        <span className="block text-sm text-gray-900 dark:text-white">
                          {userData?.username}
                        </span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">
                          {userData?.email}
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

      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="absolute w-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl md:hidden z-50 rounded-b-2xl border-b border-x border-gray-500 dark:border-gray-700"
          >
            <ul className="flex flex-col p-6 space-y-2">
              {userData?.rol === "tutor" && (
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
                      to="/tutor/assigned-projects"
                      className="flex items-center p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => setIsNavOpen(false)}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                      <span className="font-medium">
                        Ver proyectos asignados
                      </span>
                    </Link>
                  </motion.li>
                </>
              )}

              {userData?.rol === "estudiante" && (
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
                      to="/student/projects/view"
                      className="flex items-center p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => setIsNavOpen(false)}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                      <span className="font-medium">Ver mis proyectos</span>
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
};

export default Navbar;

