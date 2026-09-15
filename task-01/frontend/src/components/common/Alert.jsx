import React from "react";

// Simple alert box for error, warning, or success messages
export const Alert = ({ type = "error", message, onClose }) => {
    if (!message) return null;

    const styles = {
        error: "bg-red-50 text-red-800 border-red-200",
        success: "bg-green-50 text-green-800 border-green-200",
        warning: "bg-amber-50 text-amber-800 border-amber-200",
        info: "bg-blue-50 text-blue-800 border-blue-200",
    };

    return (
        <div
            className={`p-3 rounded border text-sm flex items-center justify-between my-2 ${styles[type] || styles.error}`}
        >
            <span>{message}</span>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-3 text-sm font-semibold hover:opacity-75 focus:outline-none"
                >
                    &times;
                </button>
            )}
        </div>
    );
};

export default Alert;
