export default <T>(error: T) => {
  if (error instanceof Error) {
    console.error(error)
  }
  else {
    const properties = Object.getOwnPropertyNames(error)
    const message = JSON.stringify(error, properties, 2)
    console.error(message)
  }
}
