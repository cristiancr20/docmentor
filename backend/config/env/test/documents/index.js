const request = require('supertest');
const { authHeader } = require('../helpers/strapi');

describe("GET-POST /documents", () => {
    it("should return Documents", async () => {
        const response = await request(strapi.server.httpServer)
            .get("/api/documents")
            .set(authHeader())
            .expect(200)

        const { data } = response.body;

        expect(data).toBeDefined();

        expect(Array.isArray(data)).toBe(true);

        console.log("Documents:", data);
    });

    it("should create a new Document", async () => {
        const mockDocumentData = {
            title: "Document 1",
            isRevised: false,
        };

        await strapi.service('api::document.document').create({
            data: mockDocumentData,
        });

        const response = await request(strapi.server.httpServer)
            .get("/api/documents")
            .set(authHeader())
            .expect(200);

        const newDocument = response.body;

        expect(newDocument).toBeDefined();

        console.log("New Document:", newDocument);
    });
})