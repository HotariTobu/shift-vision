'use client'

import { TimeClock } from "@/lib/shift"
import { useImmer } from "use-immer"
import TimeClocksCard from "./time-clocks-card"
import logError from "@/lib/util/log-error"
import { Flex, Button } from "@tremor/react"
import { useState } from "react"
import DateTimePicker from "./date-time-picker"

export default function PlanCard(props: {
  employeeId: number
  defaultTimeClocks: TimeClock[]
}) {
  const [timeClocks, updateTimeClocks] = useImmer(props.defaultTimeClocks)

  const [shiftStartAt, setShiftStartAt] = useState<Date>()
  const [shiftEndAt, setShiftEndAt] = useState<Date>()
  const [shiftButtonLoading, setShiftButtonLoading] = useState(false)

  const handleShiftButtonClick = async () => {
    if (!shiftStartAt || !shiftEndAt) {
      return
    }

    setShiftButtonLoading(true)

    try {
      const response = await fetch(`/api/shift/${props.employeeId}`, {
        method: 'post',
        body: JSON.stringify({
          startAt: shiftStartAt,
          endAt: shiftEndAt,
        }),
      })

      if (response.ok) {
        updateTimeClocks(draft => {
          draft.push({
            type: 'clock_in',
            dateTime: shiftStartAt,
          }, {
            type: 'clock_out',
            dateTime: shiftEndAt,
          })
        })
      }
    } catch (error) {
      logError(error)
    }

    setShiftButtonLoading(false)
  }

  return (
    <TimeClocksCard title="シフト" timeClocks={timeClocks} >
      <Flex className="ms-auto flex-wrap gap-4">
        <DateTimePicker onChanged={setShiftStartAt} />
        〜
        <DateTimePicker onChanged={setShiftEndAt} />
        <Button onClick={handleShiftButtonClick} loading={shiftButtonLoading}>シフトを追加する</Button>
      </Flex>
    </TimeClocksCard>
  )
}
