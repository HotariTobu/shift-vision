'use client'

import { TimeClock } from "@/lib/shift"
import { useImmer } from "use-immer"
import TimeClocksCard from "./time-clocks-card"
import { TimeClockType } from "@/lib/freee/types/time-clock"
import logError from "@/lib/util/log-error"
import { Flex, Select, SelectItem, Button } from "@tremor/react"
import { useState } from "react"
import timeClockTypeLabelMap from "../../label-map"
import DateTimePicker from "./date-time-picker"

export default (props: {
  employeeId: number
  defaultTimeClocks: TimeClock[]
}) => {
  const [timeClocks, updateTimeClocks] = useImmer(props.defaultTimeClocks)

  const [timeClockDateTime, setTimeClockDateTime] = useState<Date>()
  const [timeClockType, setTimeClockType] = useState<TimeClockType>('clock_in')
  const [timeClockButtonLoading, setTimeClockButtonLoading] = useState(false)

  const handleTimeClockButtonClick = async () => {
    if (!timeClockType || !timeClockDateTime) {
      return
    }

    setTimeClockButtonLoading(true)

    try {
      const response = await fetch(`/api/time-clock/${props.employeeId}`, {
        method: 'post',
        body: JSON.stringify({
          type: timeClockType,
          dateTime: timeClockDateTime,
        }),
      })

      if (response.ok) {
        updateTimeClocks(draft => {
          draft.push({
            type: timeClockType,
            dateTime: timeClockDateTime,
          })
        })
      }
    } catch (error) {
      logError(error)
    }

    setTimeClockButtonLoading(false)
  }

  return (
    <TimeClocksCard title="打刻" timeClocks={timeClocks} >
      <Flex className="ms-auto flex-wrap gap-4">
        <DateTimePicker onChanged={setTimeClockDateTime} />

        <Select enableClear={false} value={timeClockType} onValueChange={v => setTimeClockType(v as TimeClockType)}>
          {[...timeClockTypeLabelMap].map(([key, value]) => (
            <SelectItem key={key} value={key} className="max-w-min">{value}</SelectItem>
          ))}
        </Select>

        <Button onClick={handleTimeClockButtonClick} loading={timeClockButtonLoading}>打刻する</Button>
      </Flex>
    </TimeClocksCard>
  )
}
