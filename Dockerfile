# Usa una imagen base de Node.js
FROM node:22-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos de la aplicación al contenedor
COPY . .

# Expone el puerto en el que correrá la aplicación (3000)
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
