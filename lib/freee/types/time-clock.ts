enum TimeClockTypeEnum {
  clock_in,
  break_begin,
  break_end,
  clock_out,
}

export type TimeClockType = keyof typeof TimeClockTypeEnum
export const timeClockTypeValueSet = new Set(Object.keys(TimeClockTypeEnum))

export default interface TimeClock {
  id: number
  date: string
  type: TimeClockType
  datetime: Date
  original_datetime: Date
  note: string
}
