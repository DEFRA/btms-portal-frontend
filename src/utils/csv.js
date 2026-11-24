const formulaPrefix = /^[=+\-@\t\r]/

export const csvValue = (value) => {
  const string = value === null || value === undefined ? '' : String(value)
  const safeString =
    typeof value === 'string' && formulaPrefix.test(string)
      ? `'${string}`
      : string

  return `"${safeString.replaceAll('"', '""')}"`
}
