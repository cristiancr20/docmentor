const request = require('supertest');
const { setupStrapi, cleanupStrapi } = require("../helpers/strapi");
const ensureRolesExist = require("../helpers/ensureRoles");

beforeAll(async () => {
    await setupStrapi();
});
afterAll(async () => {
    await cleanupStrapi();
});
// user mock data
const mockUserData = {
    username: "tester",
    email: "tester@strapi.com",
    provider: "local",
    password: "1234abc",
    confirmed: true,
    blocked: null,
};

const mockRoleData = {
    tipoRol: "estudiante"
}


it("should login user and return jwt token", async () => {
    /** Creates a new user and save it to the database */
    await strapi.plugins["users-permissions"].services.user.add({
        ...mockUserData,
    });
    await request(strapi.server.httpServer)
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


// Prueba unitaria para obtener roles
it("should get all rols", async () => {
    const response = await request(strapi.server.httpServer)
        .get("/api/rols")
        .set("accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

    console.log('Response Body:', response.body);
    expect(response.body).toBeDefined();
    expect(response.body).toBeInstanceOf(Array);
});