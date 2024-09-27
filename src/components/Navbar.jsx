import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowDown, FaBell } from "react-icons/fa";
import axios from "axios";
import { getNotifications } from "../core/Notification";

function Navbar() {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

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
        console.log(notifications)
    }
  }, []);


  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNotificationToggle = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const markAsRead = async (notification) => {
    console.log("Notificación seleccionada:", notification);
    const notificationId = notification.id;
    const documentData = notification.attributes.document?.data;
    console.log("Marcando como leída la notificación:", notificationId);
    console.log("Datos del documento asociado:", documentData);

    try {
      await axios.put(
        `http://localhost:1337/api/notificacions/${notificationId}`,
        {
          data: {
            leido: true,
          },
        }
      );

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
        console.log("Redirigiendo a documento:", documentId);

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

  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-900">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 relative">
        <Link to="/">
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            DocuTrack
          </span>
        </Link>
        <div className="hidden w-full md:block md:w-auto" id="navbar-default">
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            {userRole === "tutor" && (
              <>
                <li>
                  <Link
                    to="/tutor/dashboard"
                    className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Tutor Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/proyectos/asignados"
                    className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Proyectos asignados
                  </Link>
                </li>
              </>
            )}
            {userRole === "estudiante" && (
              <>
                <li>
                  <Link
                    to="/proyecto/ver"
                    className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Ver mis Proyectos
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Parte de notificaciones y user */}
        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse relative">
          {/* USER NOTIFICACIONES */}
          {userRole === "tutor" && (
            <div className="relative">
              <button
                type="button"
                className="flex p-2 mx-2 items-center space-x-2 bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                id="notification-menu-button"
                aria-expanded={isNotificationOpen}
                onClick={handleNotificationToggle}
                aria-controls="notification-dropdown"
              >
                <FaBell className="text-yellow-500" />
                {unreadNotificationsCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Dropdown de notificaciones justo debajo del botón */}
              <div
                className={`z-50 ${
                  isNotificationOpen ? "absolute" : "hidden"
                } right-0 mt-2 w-80 p-2 max-h-96 overflow-y-auto bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600`}
              >
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
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
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-sm text-gray-700 dark:text-gray-400">
                    No hay notificaciones.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* USER PANEL */}
          <div className="relative">
            <button
              type="button"
              className="flex p-2 mx-2 items-center space-x-2 bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
              id="user-menu-button"
              aria-expanded={isDropdownOpen}
              onClick={handleDropdownToggle}
              aria-controls="user-dropdown"
            >
              <span className="sr-only">Open user menu</span>
              <span className="text-white">{userName}</span>
              <FaArrowDown className="text-white" />
            </button>

            {/* Dropdown de usuario justo debajo del botón */}
            <div
              className={`z-50 ${
                isDropdownOpen ? "absolute" : "hidden"
              } right-0 mt-2 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600`}
              id="user-dropdown"
            >
              <div className="px-4 py-3">
                <span className="block text-sm text-gray-900 dark:text-white">
                  {userName}
                </span>
                <span className="block text-sm text-gray-500 truncate dark:text-gray-400">
                  {userEmail}
                </span>
              </div>
              <ul className="py-2" aria-labelledby="user-menu-button">
                <li>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                  >
                    Cerrar Sesión
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
