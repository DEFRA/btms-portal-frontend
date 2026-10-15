export const prettyPrint = (obj) => {
  // A 'replacer' function has intentionally not
  // been provided to JSON.stringify here
  // as it isn't straightforward to determine the context for
  // the "message" and "changeSet" fields in order to replace their values
  return JSON.stringify(obj, null, 2)
}
