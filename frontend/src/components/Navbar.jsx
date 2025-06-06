import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowDown, FaBell, FaBars, FaTimes } from "react-icons/fa";
import { getNotifications, markAsReadNotification } from "../core/Notification";
import { decryptData } from "../utils/encryption";
import { AnimatePresence, motion } from "framer-motion";
import { MdAdminPanelSettings } from "react-icons/md";
import { IoLogOut } from "react-icons/io5";

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

  const checkUserRole = (userData, roleToCheck) => {
    if (!userData) return false;

    // Verificar en userData.rols (plural)
    if (userData.rols) {
      // Si es array
      if (Array.isArray(userData.rols)) {
        return userData.rols.includes(roleToCheck);
      }
      // Si es string
      if (typeof userData.rols === "string") {
        return userData.rols
          .split(",")
          .map((r) => r.trim())
          .includes(roleToCheck);
      }
    }

    // Verificar en userData.rol (singular)
    if (userData.rol) {
      // Si es array
      if (Array.isArray(userData.rol)) {
        return userData.rol.includes(roleToCheck);
      }
      // Si es string
      if (typeof userData.rol === "string") {
        return userData.rol
          .split(",")
          .map((r) => r.trim())
          .includes(roleToCheck);
      }
    }

    return false;
  };

  const loadNotifications = async (token) => {
    try {
      if (!token) {
        console.error("No se encontró token de autenticación.");
        return;
      }

      const response = await getNotifications(token);
      
      if (response && Array.isArray(response)) {
        setNotifications(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        console.warn("Formato de notificaciones no reconocido:", response);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const encryptedToken = localStorage.getItem("jwtToken");
      const encryptedUserData = localStorage.getItem("userData");

      if (!encryptedToken || !encryptedUserData) {
        console.warn(
          "Token o datos de usuario no encontrados en localStorage."
        );
        setIsLoading(false);
        return;
      }

      try {
        const jwtToken = decryptData(encryptedToken);
        const user = JSON.parse(decryptData(encryptedUserData));
        setUserData(user);
        setToken(jwtToken);

        // Verificar si el usuario es tutor antes de cargar notificaciones
        if (checkUserRole(user, "tutor")) {
          await loadNotifications(jwtToken);
        }
      } catch (error) {
        console.error(
          "Error al procesar los datos del usuario:",
          error.message
        );
        setError("Error al cargar los datos del usuario");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggle = (setter) => () => setter((prev) => !prev);

  const markAsRead = async (notification) => {
    try {
      await markAsReadNotification(notification.id);

      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === notification.id
            ? { ...notif, attributes: { ...notif.attributes, isRead: true } }
            : notif
        )
      );

      // Cerrar el dropdown de notificaciones
      setIsNotificationOpen(false);

      // Redirigir al documento si existe
      if (notification.attributes?.documents?.data?.[0]?.id) {
        const documentId = notification.attributes.documents.data[0].id;
        navigate(`/document/${documentId}`);
      } else if (notification.attributes?.project?.data?.id) {
        const projectId = notification.attributes.project.data.id;
        navigate(`/project/${projectId}`);
      } else {
        console.log("No se encontró documento o proyecto para redirigir");
      }
    } catch (error) {
      console.error("Error al marcar la notificación como leída:", error);
      errorAlert("Error al procesar la notificación");
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
        <div className="text-gray-600 dark:text-gray-400">
          No hay datos de usuario disponibles
        </div>
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
    (notification) => !notification.attributes?.isRead
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
                  {/* Opciones para los tutores */}
                  {(checkUserRole(userData, "tutor") ||
                    checkUserRole(userData, "superadmin")) && (
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
                          to="/tutor/projects/view"
                          className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500"
                        >
                          <span className="font-medium">
                            Ver proyectos asignados
                          </span>
                        </Link>
                      </motion.li>
                    </>
                  )}

                  {checkUserRole(userData, "estudiante") && (
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
              {checkUserRole(userData, "tutor") && (
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
                                notification.attributes?.isRead
                                  ? "bg-gray-900 text-white"
                                  : "bg-blue-100 text-gray-900"
                              }`}
                              onClick={() => markAsRead(notification)}
                            >
                              <p className="text-sm">
                                {notification.attributes?.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.attributes?.createdAt).toLocaleString()}
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
                  <span className="text-white">
                    {userData?.username || userData?.name}
                  </span>
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
                      className="absolute right-0 mt-2 w-3xl bg-white rounded-lg shadow dark:bg-gray-700 z-50"
                    >
                      <div className="px-4 py-3">
                        <span className="block text-sm text-gray-900 dark:text-white">
                          {userData?.username || userData?.name}
                        </span>
                        <span className="block text-sm text-gray-900 dark:text-gray-200">
                          {userData?.email}
                        </span>
                      </div>
                      {/* seccion administrativa */}
                      {checkUserRole(userData, "superadmin") && (
                        <ul className="py-2">
                          <motion.li whileHover={{ scale: 1.02 }}>
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md"
                            >
                              <MdAdminPanelSettings className="text-lg" />
                              Administración
                            </Link>
                          </motion.li>
                        </ul>
                      )}

                      <ul className="py-2">
                        <motion.li whileHover={{ scale: 1.02 }}>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 bg-gray-100 dark:bg-gray-600 rounded-md"
                          >
                            <IoLogOut className="text-lg" />
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
              {checkUserRole(userData, "tutor") && (
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
                      to="/tutor/projects/view"
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

              {checkUserRole(userData, "estudiante") && (
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
