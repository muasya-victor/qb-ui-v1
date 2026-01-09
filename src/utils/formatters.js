export const formatAmount = (amount, currencyCode = "USD") => {
  if (!amount) amount = 0;
  const numericAmount = parseFloat(amount);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(numericAmount);
  } catch (error) {
    return `${currencyCode} ${numericAmount.toFixed(2)}`;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
