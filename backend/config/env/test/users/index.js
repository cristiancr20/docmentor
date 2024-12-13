const request = require('supertest');

describe('GET-POST /users', () => {
    it("should return a users", async () => {
        const response = await request(strapi.server.httpServer)
            .get("/api/users")
            .expect(200) // Expect response http code 200

        // Verifica que la respuesta contenga una lista de usuarios
        expect(response.body).toBeInstanceOf(Array); // Esperamos que sea un array

        // Si hay usuarios, verifica que al menos uno tenga las propiedades esperadas
        if (response.body.length > 0) {
            const firstUser = response.body[0];

            // Verifica las propiedades que esperas en cada usuario
            expect(firstUser).toHaveProperty('id');
            expect(firstUser).toHaveProperty('username');
            expect(firstUser).toHaveProperty('email');

            // Asegúrate de que los valores del primer usuario sean correctos
            //expect(firstUser.username).toBe("cristian.capa20@gmail.com");
            //expect(firstUser.email).toBe("cristian.capa20@gmail.com");
        }

        console.log("Users:", response.body); // Solo para verificar la respuesta

    });


    // user mock data
    const mockUserData = {
        username: `tester_${Date.now()}`,
        email: `tester_${Date.now()}@example.com`,
        provider: "local",
        password: "1234abc",
        confirmed: true,
        blocked: null,
    };

    it("should  create user and login user and return jwt token", async () => {
        /** Creates a new user and save it to the database */
        await strapi.plugins["users-permissions"].services.user.add({
            ...mockUserData,
        });

        await request(strapi.server.httpServer) // app server is an instance of Class: http.Server
            .post("/api/auth/local")
            .set("accept", "application/json")
            .set("Content-Type", "application/json")
            .send({
                identifier: mockUserData.email,
                password: mockUserData.password,
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .then((data) => {
                expect(data.body.jwt).toBeDefined();
            });
    });


});