# Dockerfile del frontend
FROM node:20-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar solo los archivos necesarios para instalar las dependencias
COPY package*.json ./

# Instalar las dependencias en el contenedor
RUN npm install 

# Copiar el resto de tu aplicación
COPY . . 

# Build the app
#RUN npm run build

# Exponer el puerto (ajusta según tu aplicación)
EXPOSE 3000 

# Comando para iniciar tu aplicación
CMD ["npm", "start"]

# ===================================================================================================
# Produccion

# Copiar los archivos construidos desde la etapa anterior
#COPY --from=build /app/build /usr/share/nginx/html

# Exponer el puerto 80 (puerto predeterminado de Nginx)
#EXPOSE 80

# Comando para iniciar Nginx
#CMD ["nginx", "-g", "daemon off;"]
