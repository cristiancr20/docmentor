import CryptoJS from "crypto-js";

// Clave secreta desde variables de entorno
import {SECRET_KEY} from "../core/config";


// Función para encriptar
export const encryptData = (data) => {
  if (!SECRET_KEY) {
    console.error("La clave secreta no está definida");
    return null;
  }
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

// Función para desencriptar
export const decryptData = (encryptedData) => {
  if (!SECRET_KEY) {
    console.error("La clave secreta no está definida");
    return null;
  }
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};
