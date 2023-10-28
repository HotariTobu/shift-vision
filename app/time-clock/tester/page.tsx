import { getEmployees } from "@/lib/freee/hr"
import { List, ListItem } from "@tremor/react"
import Link from "next/link"

export default async function Page() {
  const employees = await getEmployees()

  return (
    <main className="p-12">
      <List>
        {employees?.map(employee => (
          <ListItem key={employee.id}>
            <Link href={`./tester/${employee.id}`}>{employee.display_name}</Link>
          </ListItem>
        ))}
      </List>
    </main>
  )
}
