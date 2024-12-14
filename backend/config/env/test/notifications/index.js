
const request = require('supertest');

describe('GET-POST /notification', () => {

    it("should return Notifications", async () => {
        const response = await request(strapi.server.httpServer)
            .get("/api/notifications")
            .expect(200) // Expect response http code 200

        const { data } = response.body;

        // Asegúrate de que `data` esté definido
        expect(data).toBeDefined();

        // Verifica que data sea una array
        expect(Array.isArray(data)).toBe(true);

        console.log("Notifications:", data); // Solo para verificar la respuesta
    })

    it("should create a new Notification", async () => {
        const mockNotificationData = {
            message:"test de notification",
            isRead:false
        };

        await strapi.service('api::notification.notification').create({
            data: mockNotificationData,
        });

        const response = await request(strapi.server.httpServer)
            .get("/api/notifications")
            .expect(200);

        const newNotification = response.body;

        expect(newNotification).toBeDefined();

        console.log("New Notification:", newNotification);
    });

});