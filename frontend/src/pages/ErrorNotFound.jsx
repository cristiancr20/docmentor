import React from "react";
import { Link } from "react-router-dom";

function ErrorNotFound() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1
          className={`text-9xl font-bold text-gray-800 mb-4 transition-all duration-1000 ease-in-out ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10"
          }`}
        >
          404
        </h1>
        <p
          className={`text-2xl text-gray-600 mb-8 transition-all duration-1000 delay-300 ease-in-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          Oops! Parece que te has perdido.
        </p>
        <Link
          href="/"
          className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 ease-in-out ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default ErrorNotFound;
