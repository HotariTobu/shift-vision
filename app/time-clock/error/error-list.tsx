import { AccordionList, Accordion, AccordionHeader, AccordionBody, Grid, Bold, Text } from "@tremor/react"
import { getTimeClockErrorsByDate } from "./actions"
import timeClockTypeLabelMap from "../label-map"
import { TimeClock } from "@/lib/shift"
import TimeClockCell from "./time-clock-cell"
import { use } from "react"

const formatDate = (dateTime: Date) => dateTime.toLocaleDateString('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
})

const formatTimeClock = (timeClock: TimeClock | null) => ({
  type: timeClockTypeLabelMap.get(timeClock?.type ?? ''),
  time: timeClock?.dateTime?.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  }),
})

export default (props: {
  year: number
  month: number
}) => {
  const errorsByDate = Array.from(use(getTimeClockErrorsByDate({
    year: props.year,
    month: props.month,
  })))
  errorsByDate.reverse()

  return (
    <AccordionList className="mt-4">
      {errorsByDate.map(([date, errors]) => (
        <Accordion defaultOpen={true} key={date.getTime()}>
          <AccordionHeader>{formatDate(date)}</AccordionHeader>
          <AccordionBody>
            <Grid numItems={3} className="mb-2">
              <Bold>名前</Bold>
              <Bold>予定</Bold>
              <Bold>実際</Bold>
            </Grid>

            {errors.map(({ employee, error }) => (
              <Grid numItems={3} className="mt-2" key={`${employee.id} ${error.dateTime.getTime()}`}>
                <Text>{employee.display_name}</Text>
                <TimeClockCell {...formatTimeClock(error.plan)}></TimeClockCell>
                <TimeClockCell {...formatTimeClock(error.fact)}></TimeClockCell>
              </Grid>
            ))}
          </AccordionBody>
        </Accordion>
      ))}
    </AccordionList>
  )
}
