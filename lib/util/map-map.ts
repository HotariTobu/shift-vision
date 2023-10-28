const mapMap = <K1, V1, K2, V2>(map: Map<K1, V1>, func: (k: K1, v: V1) => [K2, V2]) => {
  const newMap = new Map<K2, V2>()

  for (const [key, value] of map) {
    const [newKey, newValue] = func(key, value)
    newMap.set(newKey, newValue)
  }

  return newMap
}

export default mapMap

export const mapMapKeys = <K1, K2, V>(map: Map<K1, V>, func: (k: K1) => K2) => {
  return mapMap(map, (k, v) => [func(k), v])
}

export const mapMapValues = <K, V1, V2>(map: Map<K, V1>, func: (v: V1) => V2) => {
  return mapMap(map, (k, v) => [k, func(v)])
}
