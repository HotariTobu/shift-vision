import NextResult from "./next-result"

export default <T>(iterator: T[] | IterableIterator<T>, func: (a: T, b: T) => number) => {
  if (Array.isArray(iterator)) {
    iterator = iterator.values()
  }

  let { value: minValue, done }: NextResult<T> = iterator.next()
  if (done) {
    return null
  }

  let minIndex = 0

  for (let index = 1; true; index++) {
    const { value, done } = iterator.next()
    if (done) {
      break
    }

    if (func(minValue, value) > 0) {
      minIndex = index
      minValue = value
    }
  }

  return {
    index: minIndex,
    value: minValue,
  }
}
