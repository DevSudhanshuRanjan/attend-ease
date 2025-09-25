import React from 'react';

const ErrorMessage = ({ message, onClose, className = "" }) => {
  const getErrorIcon = () => {
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('connection')) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (message.toLowerCase().includes('credential') || message.toLowerCase().includes('login')) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  const getErrorType = () => {
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('connection')) {
      return 'Network Error';
    } else if (message.toLowerCase().includes('credential') || message.toLowerCase().includes('login')) {
      return 'Authentication Error';
    } else if (message.toLowerCase().includes('timeout')) {
      return 'Timeout Error';
    } else {
      return 'Error';
    }
  };

  const getErrorSuggestion = () => {
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('connection')) {
      return 'Please check your internet connection and try again.';
    } else if (message.toLowerCase().includes('credential') || message.toLowerCase().includes('login')) {
      return 'Please verify your User ID and password are correct.';
    } else if (message.toLowerCase().includes('timeout')) {
      return 'The request took too long. Please try again.';
    } else if (message.toLowerCase().includes('too many')) {
      return 'Please wait a few minutes before trying again.';
    } else {
      return 'Please try again. If the problem persists, contact support.';
    }
  };

  return (
    <div className={`rounded-md bg-red-50 border border-red-200 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {getErrorType()}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p className="mb-2">{message}</p>
            <p className="text-red-600">{getErrorSuggestion()}</p>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Dismiss
            </button>
            
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-white px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-gray-50 border border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
        
        {/* Close Button */}
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;