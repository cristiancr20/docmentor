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

  if (!encryptedData || typeof encryptedData !== "string") {
    console.error("Datos encriptados inválidos:", encryptedData);
    return null;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      console.warn("No se pudo desencriptar el dato. ¿Clave incorrecta o datos corruptos?");
      return null;
    }

    const value = JSON.parse(decryptedString);

    // Compatibilidad con las sesiones guardadas antes de corregir el doble
    // JSON.stringify: allí el valor cifrado era la cadena JSON del objeto, así
    // que al descifrarlo sale un string en lugar del objeto. Sin esto, quien
    // tuviera sesión iniciada de antes quedaba con `user` convertido en una
    // cadena: seguía pareciendo autenticado pero sin `rols`, y cualquier ruta
    // protegida lo devolvía al inicio.
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        // Era un string de verdad (por ejemplo el JWT), no un objeto anidado.
        return value;
      }
    }

    return value;
  } catch (err) {
    console.error("Error al desencriptar los datos:", err);
    return null;
  }
};

