import axios from "axios";
import { API_URL } from "./config";

//METODO PARA GUARDAR LOS EMAILS PARA EL ENVIO DE CORREOS   
export const saveEmail = async (email_notifications) => {
  try {
    const response = await axios.post(`${API_URL}/api/settings`, { data: email_notifications });
    return response.data;
  } catch (error) {
    console.error("Error al guardar el email:", error);
    throw error;
  }
};

//METODO PARA LISTAR LOS EMAILS
export const getEmail = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/settings`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el email:", error);
    throw error;
  }
};

//METODO PARA ACTUALIZAR EL ESTADO DEL EMAIL EN USO (isActual: true or false) y que el email anterior pase a ser isActual: false

export const updateEmail = async (emailId) => {
  try {
    // 1. Obtener todos los emails
    const responseEmails = await axios.get(`${API_URL}/api/settings`);
    const emails = responseEmails.data.data;

    // 2. Poner todos los emails en `isActual: false`
    await Promise.all(
      emails.map((email) =>
        axios.put(`${API_URL}/api/settings/${email.id}`, {
          data: { isActual: false },
        })
      )
    );

    // 3. Poner el email seleccionado en `isActual: true`
    const response = await axios.put(`${API_URL}/api/settings/${emailId}`, {
      data: { isActual: true },
    });

    return response.data;
  } catch (error) {
    console.error("Error al actualizar el email:", error);
    throw error;
  }
};

