'use strict';

/**
 * Lee el body de una ruta custom aceptando las dos formas en que llega desde
 * el cliente: envuelto en `data` como en las rutas core de Strapi
 * (`{ data: { status } }`) o plano (`{ status }`).
 *
 * Antes cada handler lo leía a su manera: `setReviewed` aceptaba ambas formas
 * y `changeStatus` solo la plana, así que un cliente que enviaba `{ data }` a
 * `/status` recibía "Estado inválido" sin más pista.
 */
const readBody = (ctx) => ctx.request.body?.data ?? ctx.request.body ?? {};

module.exports = { readBody };
