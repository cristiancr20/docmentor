# Dockerfile para el frontend

# Usa una imagen base de Node
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia solo los archivos necesarios para instalar las dependencias
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm ci

# Ahora copia el resto de tu aplicación
COPY . .

# Expone el puerto que usa React
EXPOSE 3000

# Comando para iniciar la aplicación de React
CMD ["npm", "start"]
