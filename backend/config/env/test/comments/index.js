const request = require('supertest');

describe('GET-POST-UPDATE-DELETE /comments', () => {
    it("should return Comments", async () => {
        const response = await request(strapi.server.httpServer)
            .get("/api/comments")
            .expect(200)

        const { data } = response.body;

        expect(data).toBeDefined();

        expect(Array.isArray(data)).toBe(true);

        console.log("Comments:", data);
    });

    it("should create a new Comment", async () => {
        const mockCommentData = {
            highlightAreas: "highlightAreas test",
            quote: "sdsdfsdf",
            correction: "correccion test",
        };

        await strapi.service('api::comment.comment').create({
            data: mockCommentData,
        });

        const response = await request(strapi.server.httpServer)
            .get("/api/comments")
            .expect(200);

        const newComment = response.body;

        expect(newComment).toBeDefined();

        console.log("New Comment:", newComment);
    });

    it("should edit a Comment", async () => {
/*         const mockCommentData = {
            highlightAreas: "highlightAreas test",
            quote: "sdsdfsdf",
            correccion: "correccion test",
        };
        await strapi.service('api::comment.comment').create({
            ...mockCommentData,
        }); */

        await strapi.service('api::comment.comment').update(1, {
            data: {
                highlightAreas: "highlightAreas test",
                quote: "sdsdfsdf",
                correction: "correccion test",
            },
        });


        const response = await request(strapi.server.httpServer)
            .get("/api/comments")
            .expect(200);

        const newComment = response.body;

        expect(newComment).toBeDefined();

        console.log("New Comment:", newComment);
    });


    it("should delete a Comment", async () => {
        await strapi.service('api::comment.comment').delete(1);

        const response = await request (strapi.server.httpServer)
            .get("/api/comments")
            .expect(200);

        const deleteComment = response.body;

        expect(deleteComment).toBeDefined();

        console.log("Delete Comment:", deleteComment);
    });
})