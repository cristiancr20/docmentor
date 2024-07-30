import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Autenticación del usuario
      const authResponse = await axios.post(
        "http://localhost:1337/api/auth/local",
        {
          identifier: email,
          password: password,
        }
      );

      const { jwt, user } = authResponse.data;

      // Guarda el JWT
      localStorage.setItem("jwt", jwt);

      // Obtener el rol del usuario usando GraphQL
      const graphqlResponse = await axios.post(
        "http://localhost:1337/graphql",
        {
          query: `
            query {
            usersPermissionsUser(id: ${user.id}) {
              data {
                attributes {
                  username
                  email
                  rol {
                    data {
                      attributes {
                        tipoRol
                      }
                    }
                  }
                }
              }
            }
          }
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      const userData =
        graphqlResponse.data.data.usersPermissionsUser.data.attributes;
      const userRole = userData.rol.data.attributes.tipoRol;
      const username = userData.username;
      const useremail = userData.email;

      localStorage.setItem("rol", userRole);
      localStorage.setItem("username", username);
      localStorage.setItem("email", useremail)

      // Redirige según el rol
      if (userRole === "tutor") {
        navigate("/tutor-dashboard");
      } else if (userRole === "estudiante") {
        navigate("/student-dashboard");
      }
    } catch (error) {
      console.error("An error occurred:", error.response);
    }
  };

  return (
    <div className="bg-cover bg-center bg-no-repeat bg-blend-multiply  min-h-screen  ">
      <div className="px-4 mx-auto max-w-screen-xl py-24 lg:py-56 ">
        <form
          class="max-w-sm mx-auto bg-gray-900 p-4 rounded-lg"
          onSubmit={handleSubmit}
        >
          <div class="mb-5">
            <label
              for="email"
              class="block mb-2 text-sm font-medium  text-white"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              class="bg-gray-50 border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="nombre@unl.edu.ec"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div class="mb-5">
            <label
              for="password"
              class="block mb-2 text-sm font-medium  text-white"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              class="bg-gray-50 border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
