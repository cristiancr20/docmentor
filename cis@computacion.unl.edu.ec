version: '3'

services:
  frontend:
    restart: unless-stopped
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:1337  # Cambiado a localhost

  backend:
    restart: unless-stopped
    build:
      context: ./backend
    ports:
      - "1337:1337"
    volumes:
      - ./backend:/app
      - /app/node_modules  # Añadido para preservar node_modules del contenedor
    environment:
      NODE_ENV: development
      DATABASE_CLIENT: postgres  # Cambiado a postgres
      DATABASE_HOST: db  # Nombre del servicio de PostgreSQL
      DATABASE_PORT: 5432  # Puerto por defecto de PostgreSQL
      DATABASE_NAME: strapi  # Nombre de la base de datos
      DATABASE_USERNAME: strapi_user  # Usuario de la base de datos
      DATABASE_PASSWORD: strapi_password  # Contraseña de la base de datos

  db:
    restart: unless-stopped
    image: postgres:latest
    volumes:
      - docmentor_postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: strapi_user
      POSTGRES_PASSWORD: strapi_password
      POSTGRES_DB: strapi  
    ports:
      - "5436:5432"

volumes:
  docmentor_postgres_data: