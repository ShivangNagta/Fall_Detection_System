import React from 'react';

const FallNotification = ({ message, onClose }) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50">
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button
          className="ml-4 bg-red-800 hover:bg-red-900 text-white px-2 py-1 rounded"
          onClick={onClose}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default FallNotification;
