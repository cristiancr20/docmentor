const crypto = require('crypto');

function generateSecureSecret(length = 32) {
    return crypto.randomBytes(length).toString('base64');
}

const appKeys = [
    generateSecureSecret(32),
    generateSecureSecret(32)
].join(',');

console.log('=== Copia estas variables a tu archivo .env ===\n');
console.log(`# Configuración del servidor`);
console.log('HOST=0.0.0.0');
console.log('PORT=1337');
console.log('\n# Variables de seguridad de Strapi');
console.log(`APP_KEYS=${appKeys}`);
console.log(`API_TOKEN_SALT=${generateSecureSecret()}`);
console.log(`ADMIN_JWT_SECRET=${generateSecureSecret()}`);
console.log(`TRANSFER_TOKEN_SALT=${generateSecureSecret()}`);
console.log(`JWT_SECRET=${generateSecureSecret()}`);
console.log('\n# Agrega aquí tus variables de Turso existentes');
console.log('# TURSO_URL=tu_url_actual');
console.log('# TURSO_AUTH_TOKEN=tu_token_actual');