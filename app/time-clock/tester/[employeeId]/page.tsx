import { getEmployee, getTimeClocks } from "@/lib/freee/hr"
import { getTimeClockMap } from "@/lib/shift"
import { Title } from "@tremor/react"
import FactCard from "./fact-card"
import PlanCard from "./plan-card"

export default async (props: {
  params: {
    employeeId: string
  }
}) => {
  const employeeId = Number.parseInt(props.params.employeeId)

  if (Number.isNaN(employeeId)) {
    throw new Error('URL param employeeId must be an integer')
  }

  const employee = await getEmployee(employeeId)

  const facts = (await getTimeClocks(employeeId)).map(tc => {
    return {
      type: tc.type,
      dateTime: tc.datetime,
    }
  })

  const planMap = await getTimeClockMap({
    employeeIds: employeeId
  })
  const plans = Array.from(planMap.get(employeeId) ?? [])

  return (
    <main className="p-12">
      <Title>{employee.display_name}</Title>
      <FactCard employeeId={employeeId} defaultTimeClocks={facts} />
      <PlanCard employeeId={employeeId} defaultTimeClocks={plans} />
    </main>
  )
}
