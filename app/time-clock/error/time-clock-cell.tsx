import { Flex, Text } from "@tremor/react"

export default (props: {
  type?: string
  time?: string
}) => {
  return (
    <Flex className="justify-start gap-4">
      <Text>{props.time}</Text>
      <Text>{props.type}</Text>
    </Flex>
  )
}
