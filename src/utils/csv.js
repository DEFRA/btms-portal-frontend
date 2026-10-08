export const csvValue = (value) => {
  const string = value === null || value === undefined ? '' : String(value)

  return `"${string.replaceAll('"', '""')}"`
}
