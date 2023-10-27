import { Accordion, AccordionBody, AccordionHeader, AccordionList, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text, Title } from "@tremor/react"
import { getTimeClockErrorsByDate } from "./logic"
import { TimeClock } from "@/lib/shift"
import timeClockTypeLabelMap from "../label-map"

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

const TimeClockCell = (props: {
  type?: string
  time?: string
}) => {
  return (
    <TableCell>
      <Text>{props.type}</Text>
      <Text>{props.time}</Text>
    </TableCell>
  )
}

export default async (props: {
  searchParams: {
    y?: number
    m?: number
  }
}) => {
  const errorsByDate = Array.from(await getTimeClockErrorsByDate())
  errorsByDate.reverse()

  return (
    <main className="p-12">
      <Title>Dashboard</Title>
      <Text>Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</Text>

      <AccordionList>
        {errorsByDate.map(([date, errors]) => (
          <Accordion defaultOpen={true}>
            <AccordionHeader>{formatDate(date)}</AccordionHeader>
            <AccordionBody>
              <Table>
                <TableHead>
                  <TableHeaderCell>名前</TableHeaderCell>
                  <TableHeaderCell>予定</TableHeaderCell>
                  <TableHeaderCell>実際</TableHeaderCell>
                </TableHead>
                <TableBody>
                  {errors.map(({ employee, error }) => (
                    <TableRow>
                      <TableCell>{employee.display_name}</TableCell>
                      <TimeClockCell {...formatTimeClock(error.plan)}></TimeClockCell>
                      <TimeClockCell {...formatTimeClock(error.fact)}></TimeClockCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionBody>
          </Accordion>
        ))}
      </AccordionList>
    </main>
  )
}
