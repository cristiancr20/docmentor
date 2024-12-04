const request = require('supertest');

// user mock data
const mockUserData = {
    username: "tester",
    email: "tester@strapi.com",
    provider: "local",
    password: "1234abc",
    confirmed: true,
    blocked: null,
};

it("debe iniciar sesión de usuario y devolver token jwt", async () => {
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

it('debe devolver los datos del usuario autenticado', async () => {
    /** Gets the default user role */
    const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({}, []);

    const role = defaultRole ? defaultRole.id : null;

    /** Creates a new user an push to database */
    const user = await strapi.plugins['users-permissions'].services.user.add({
        ...mockUserData,
        username: 'tester2',
        email: 'tester2@strapi.com',
        role,
    });

    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
        id: user.id,
    });

    await request(strapi.server.httpServer) // app server is an instance of Class: http.Server
        .get('/api/users/me')
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + jwt)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(data => {
            expect(data.body).toBeDefined();
            expect(data.body.id).toBe(user.id);
            expect(data.body.username).toBe(user.username);
            expect(data.body.email).toBe(user.email);
        });
});

// Assuming you've created a custom role with 'users-permissions.read' permission

it("debe devolver los usuarios de la base de datos", async () => {
    // ... existing code to create roles and users ...

    const userWithReadPermission = await strapi.query('plugin::users-permissions.user').findOne({
        username: 'tester3', // Assuming username is unique
    }, []);
    
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
        id: userWithReadPermission.id,
    });

    console.log('Generated JWT:', jwt); // Log the JWT

    await request(strapi.server.httpServer)
        .get("/api/users")
        .set('Authorization', `Bearer ${jwt}`)
        .then((response) => {
            console.log('Response Status:', response.status); // Log the response status
            console.log('Response Body:', response.body); // Log the response body
            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body.length).toBeGreaterThan(0);
        })
        .catch((err) => {
            console.error('Error:', err.response ? err.response.body : err); // Log the error
        });

});