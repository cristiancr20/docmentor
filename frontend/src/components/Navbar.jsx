import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowDown, FaBars, FaTimes } from "react-icons/fa";
import { decryptData } from "../utils/encryption";
import { AnimatePresence, motion } from "framer-motion";
import { MdAdminPanelSettings } from "react-icons/md";
import { IoLogOut } from "react-icons/io5";
import { usePermission } from "../context/PermissionContext";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { hasPermission } = usePermission();

  // Menú de revisión (tutores/administradores) vs menú de estudiante,
  // derivado de permisos dinámicos en lugar de roles hardcodeados
  const canReviewDocuments = hasPermission("REVIEW_DOCUMENT");
  const canCreateProjects = hasPermission("CREATE_PROJECT");
  const canAccessAdministration =
    hasPermission("MANAGE_USERS") ||
    hasPermission("MANAGE_ROLES") ||
    hasPermission("MANAGE_SETTINGS");
  const showReviewerMenu = canReviewDocuments;
  const showStudentMenu = canCreateProjects && !canReviewDocuments;

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
        const user = JSON.parse(decryptData(encryptedUserData));
        setUserData(user);
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
                  {/* Opciones para quienes revisan documentos */}
                  {showReviewerMenu && (
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

                  {showStudentMenu && (
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
              {/* Notificaciones en tiempo real para cualquier usuario autenticado */}
              <NotificationBell />
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
                      {canAccessAdministration && (
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
              {showReviewerMenu && (
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

              {showStudentMenu && (
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
