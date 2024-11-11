# DOCKERFILE BACKEND
# Usa la versión específica de Node.js que estás usando en tu entorno de desarrollo
FROM node:18.20.4

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Instala las dependencias necesarias para compilar mejor-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copia los archivos package.json y package-lock.json (si existe)
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto de los archivos del proyecto
COPY . .

# Reconstruye los módulos nativos para asegurarse de que sean compatibles con la versión de Node.js del contenedor
RUN npm rebuild

# Expone el puerto en el que se ejecutará Strapi
EXPOSE 1337

# Comando para ejecutar la aplicación
CMD ["npm", "run", "develop"]