import { DatePicker, Flex, NumberInput } from "@tremor/react"
import { useState } from "react"
import { ja } from 'date-fns/locale'

export default (props: {
  defaultDateTime?: Date
  onChanged?: (dateTime?: Date) => void
}) => {
  const [date, setDate] = useState(props.defaultDateTime)
  const [hour, setHour] = useState(props.defaultDateTime?.getFullYear())
  const [minute, setMinute] = useState(props.defaultDateTime?.getMonth())

  const handleChange = (newValue: {
    date?: Date
    hour?: number
    minute?: number
  }) => {
    setDate(newValue.date ?? date)
    setHour(newValue.hour ?? hour)
    setMinute(newValue.minute ?? minute)

    if (!props.onChanged) {
      return
    }

    const currentDate = newValue.date ?? date

    if (!currentDate) {
      props.onChanged(currentDate)
      return
    }

    const dateTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      newValue.hour ?? hour,
      newValue.minute ?? minute,
    )

    props.onChanged(dateTime)
  }

  return (
    <Flex>
      <DatePicker className="max-w-min me-4" locale={ja} defaultValue={date} onValueChange={date => handleChange({ date })} />
      <NumberInput className="max-w-[4rem] me-4" enableStepper={false} placeholder="Hour" min={0} max={23} defaultValue={hour} onValueChange={hour => handleChange({ hour })} />
      <NumberInput className="max-w-[4rem]" enableStepper={false} placeholder="Minute" min={0} max={59} defaultValue={minute} onValueChange={minute => handleChange({ minute })} />
    </Flex>
  )
}
