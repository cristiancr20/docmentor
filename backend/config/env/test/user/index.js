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
    await strapi.plugins["users-permissions"].services.user.add({ ...mockUserData });

    const response = await request(strapi.server.httpServer)
        .post("/api/auth/local")
        .set("accept", "application/json")
        .set("Content-Type", "application/json")
        .send({
            identifier: mockUserData.email,
            password: mockUserData.password,
        });

    expect(response.status).toBe(200);
    expect(response.body.jwt).toBeDefined();
});


it("debe devolver los datos del usuario autenticado", async () => {
    const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({}, []);
    const user = await strapi.plugins['users-permissions'].services.user.add({
        ...mockUserData,
        username: 'tester2',
        email: 'tester2@strapi.com',
        role: defaultRole ? defaultRole.id : null,
    });

    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

    const response = await request(strapi.server.httpServer)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${jwt}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
        id: user.id,
        username: user.username,
        email: user.email,
    });
});

// Assuming you've created a custom role with 'users-permissions.read' permission

it("debe devolver los usuarios de la base de datos", async () => {
    const role = await strapi.query('plugin::users-permissions.role').findOne({ name: 'Authenticated' });
    const userWithReadPermission = await strapi.plugins['users-permissions'].services.user.add({
        username: 'tester3',
        email: 'tester3@strapi.com',
        password: '1234abc',
        role: role.id,
    });

    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: userWithReadPermission.id });

    const response = await request(strapi.server.httpServer)
        .get("/api/users")
        .set('Authorization', `Bearer ${jwt}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
});

