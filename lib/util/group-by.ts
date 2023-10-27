export default <V, K>(values: Iterable<V>, func: (v: V) => K) => {
  const map = new Map<K, V[]>()

  for (const value of values) {
    const key = func(value)

    let valueList = map.get(key)
    if (typeof valueList === 'undefined') {
      valueList = []
      map.set(key, valueList)
    }

    valueList.push(value)
  }

  return map
}

export const groupByAsync = async <V, K>(values: AsyncIterable<V>, func: (v: V) => K) => {
  const map = new Map<K, V[]>()

  for await (const value of values) {
    const key = func(value)

    let valueList = map.get(key)
    if (typeof valueList === 'undefined') {
      valueList = []
      map.set(key, valueList)
    }

    valueList.push(value)
  }

  return map
}
