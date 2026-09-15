// Currency formatter
export const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `Rs. ${num.toFixed(2)}`;
};

export const CURRENCY_SYMBOL = "Rs.";
