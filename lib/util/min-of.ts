import NextResult from "./next-result"

export default <T>(iterator: T[] | IterableIterator<T>, func: (a: T, b: T) => number) => {
  if (Array.isArray(iterator)) {
    iterator = iterator.values()
  }

  let { value: minValue }: NextResult<T> = iterator.next()

  while (true) {
    const { value, done } = iterator.next()
    if (done) {
      break
    }

    if (func(minValue, value) > 0) {
      minValue = value
    }
  }

  return minValue
}
