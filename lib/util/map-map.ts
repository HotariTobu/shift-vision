export default <K, V1, V2>(map: Map<K, V1>, func: (v: V1) => V2) => {
  const newMap = new Map<K, V2>()

  for (const [key, value] of map) {
    const newValue = func(value)
    newMap.set(key, newValue)
  }

  return newMap
}
