import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LiaUniversitySolid } from "react-icons/lia";
import { CiUser } from "react-icons/ci";
import { ArrowRight } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-cover bg-center bg-no-repeat bg-gray-900 bg-blend-multiply h-screen flex flex-col bg-[url('https://i.pinimg.com/736x/d9/31/5e/d9315e4c788771c8cba5406db9791d75.jpg')]">
      <div className="flex-grow flex flex-col justify-center items-center px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="mb-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none text-white text-center"
        >
          Bienvenido a DocMentor
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="mb-8 text-sm md:text-base lg:text-lg font-normal text-gray-300 text-center max-w-3xl"
        >
          DocMentor es el sistema de versionado documental que transforma la
          forma en que gestionas tus documentos. Con un enfoque en la
          colaboración entre estudiantes y tutores, DocMentor te permite
          rastrear, revisar y mejorar documentos de manera eficiente.
        </motion.p>

        <LoginOptions navigate={navigate} />
      </div>
    </section>
  );
};

const LoginOptions = ({ navigate }) => {
  return (
    <div className="w-full max-w-4xl">
      {/* <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl md:text-2xl font-bold text-center mb-4 text-white"
      >
        Seleccione su tipo de cuenta
      </motion.h2> */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-8">
        <LoginCard
          title="Usuarios"
          description="Bienvenido, puedes iniciar sesión o registrarte"
          icon={<CiUser className="h-6 w-6" />}
          loginPath="/login"
          signUpPath="/sign-up"
          navigate={navigate}
        />
        {/* <LoginCard
          title="Usuario Institucional"
          description="Para personal de la institución"
          icon={<LiaUniversitySolid className="h-6 w-6" />}
          loginPath="/login-institucional"
          navigate={navigate}
        /> */}
      </div>
    </div>
  );
};

const LoginCard = ({
  title,
  description,
  icon,
  loginPath,
  signUpPath,
  navigate,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4"
    >
      <div className="mb-2">
        <h3 className="flex items-center justify-center gap-2 text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          {icon}
          {title}
        </h3>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-1">
          {description}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate(loginPath)}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded text-sm flex items-center justify-center"
        >
          Iniciar Sesión
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
        {signUpPath && (
          <button
            onClick={() => navigate(signUpPath)}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm"
          >
            Registrarse
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;
