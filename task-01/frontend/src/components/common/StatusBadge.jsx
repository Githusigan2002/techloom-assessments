import React from "react";

// Practical status badge component with clear, subtle colors
export const StatusBadge = ({ status }) => {
    if (!status) return null;

    const normalized = String(status).toUpperCase();

    // Map status to neutral, readable color classes
    const getBadgeStyle = () => {
        switch (normalized) {
            case "PAID":
            case "CONFIRMED":
            case "IN STOCK":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";

            case "RESERVED":
            case "ACTIVE":
            case "LOW STOCK":
                return "bg-amber-50 text-amber-800 border-amber-200";

            case "PENDING":
                return "bg-blue-50 text-blue-700 border-blue-200";

            case "CANCELLED":
            case "FAILED":
            case "OUT OF STOCK":
                return "bg-rose-50 text-rose-700 border-rose-200";

            case "EXPIRED":
            case "RELEASED":
            default:
                return "bg-gray-100 text-gray-700 border-gray-300";
        }
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getBadgeStyle()}`}
        >
            {status}
        </span>
    );
};

export default StatusBadge;
