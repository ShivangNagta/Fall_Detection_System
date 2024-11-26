import React from 'react';

const FallHistory = ({ history }) => {
  return (
    <div className="p-6 bg-zinc-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Fall History</h2>
      {history.length === 0 ? (
        <p className="text-gray-400">No fall events recorded.</p>
      ) : (
        <ul className="space-y-4">
          {history
            .slice()
            .reverse()
            .map((event, index) => (
              <li
                key={index}
                className="bg-zinc-700 text-gray-100 p-4 rounded-lg shadow-md"
              >
                <p>{event.message}</p>
                <p className="text-sm text-gray-400">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default FallHistory;



