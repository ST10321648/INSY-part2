// ✅ Format numbers to South African Rands (ZAR)
export const formatCurrency = (value) => {
  if (!value || isNaN(value)) return "R 0.00";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
};
