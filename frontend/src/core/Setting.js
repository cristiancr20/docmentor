import api from './apiClient';

//METODO PARA GUARDAR LOS EMAILS PARA EL ENVIO DE CORREOS   
export const saveEmail = async (email_notifications) =>
  (await api.post(`/api/settings`, { data: email_notifications })).data;

//METODO PARA LISTAR LOS EMAILS
export const getEmail = async () => (await api.get(`/api/settings`)).data;

//METODO PARA ACTUALIZAR EL ESTADO DEL EMAIL EN USO (isActual: true or false) y que el email anterior pase a ser isActual: false

export const updateEmail = async (emailId) => {
  // 1. Obtener todos los emails
  const responseEmails = await api.get(`/api/settings`);
  const emails = responseEmails.data.data;

  // 2. Poner todos los emails en `isActual: false`
  await Promise.all(
    emails.map((email) =>
      api.put(`/api/settings/${email.id}`, {
        data: { isActual: false },
      })
    )
  );

  // 3. Poner el email seleccionado en `isActual: true`
  const response = await api.put(`/api/settings/${emailId}`, {
    data: { isActual: true },
  });

  return response.data;
};
