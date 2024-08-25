import React, { useState } from 'react';

const CommentsPanel = ({ comments = [], onAddComment }) => {
    const [newComment, setNewComment] = useState('');

    const handleAddComment = () => {
        if (newComment.trim() !== '') {
            onAddComment(newComment);
            setNewComment('');  // Clear input field after adding comment
        }
    };

    return (
        <div className="comments-panel bg-gray-100 p-4 rounded">
            <h3 className="text-lg font-bold mb-4">Comentarios</h3>
            <ul className="mb-4">
                {comments.map((comment, index) => (
                    <li key={index} className="mb-2 p-2 bg-white rounded shadow">
                        {comment.attributes.correccion}
                    </li>
                ))}
            </ul>
            <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Añadir un comentario..."
            />
            <button
                onClick={handleAddComment}
                className="mt-2 p-2 bg-blue-500 text-white rounded"
            >
                Agregar Comentario
            </button>
        </div>
    );
};

export default CommentsPanel;
