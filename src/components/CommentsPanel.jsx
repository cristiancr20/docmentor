import React from "react";

const CommentsPanel = ({ comments = [] }) => {
  return (
    <div className="comments-panel bg-gray-100 p-4 rounded">
      <h3 className="text-lg font-bold mb-4">Comentarios</h3>
      <div className="p-4 bg-gray-900 rounded-lg shadow-md">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-base">No hay comentarios</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition ease-in-out duration-150 cursor-pointer"
            >
              <p className="text-gray-800 text-base mb-2">
                <strong className="font-semibold">Comentario:</strong>{" "}
                {comment.attributes.correccion}
              </p>
              {comment.attributes.quote && (
                <p className="text-gray-600 text-sm">
                  <strong className="font-semibold">Texto seleccionado:</strong>{" "}
                  {comment.attributes.quote}
                </p>
              )}
              {/* Agregar lógica para manejar clics en comentarios */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsPanel;
