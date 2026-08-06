//final price after applying a discount percentage
export function calculateFinalPrice(basePrice, discountPercent) {
  const discount = (basePrice * discountPercent) / 100;
  return Math.round((basePrice - discount) * 100) / 100;
}