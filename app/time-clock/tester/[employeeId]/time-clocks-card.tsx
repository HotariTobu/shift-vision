import { TimeClock } from "@/lib/shift"
import { Card, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Flex, Text } from "@tremor/react"
import { ReactNode } from "react"
import timeClockTypeLabelMap from "../../label-map"

export default function TimeClocksCard(props: {
  children: ReactNode
  title: string
  timeClocks: TimeClock[]
}) {
  return (
    <Card className="mt-4">
      <Text>{props.title}</Text>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>種類</TableHeaderCell>
            <TableHeaderCell>日時</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.timeClocks.map(timeClock => (
            <TableRow key={timeClock.dateTime.getTime()}>
              <TableCell>{timeClockTypeLabelMap.get(timeClock.type)}</TableCell>
              <TableCell>{timeClock.dateTime.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Flex className="mt-4">
        {props.children}
      </Flex>
    </Card>
  )
}
