// Format a number as currency
export function formatCurrency(value: number | string): string {
  // Convert string to number if needed
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return "$0.00"
  }

  // Format with 2 decimal places and add dollar sign
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numValue)
}

// Format a number as percentage
export function formatPercentage(value: number | string): string {
  // Convert string to number if needed
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return "0%"
  }

  // Format with 2 decimal places and add percent sign
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numValue / 100)
}

// Convert a string to a URL-friendly slug
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word characters
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}
