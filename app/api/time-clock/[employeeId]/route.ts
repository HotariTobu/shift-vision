import { postTimeClock } from "@/lib/freee/hr";
import { TimeClockType, timeClockTypeValueSet } from "@/lib/freee/types/time-clock";
import { validateDate, validateEnum } from "../../validate";
import logError from "@/lib/util/log-error";

export const POST = async (request: Request, context: {
  params: {
    employeeId: string
  }
}) => {
  const employeeId = Number(context.params.employeeId)

  if (Number.isNaN(employeeId)) {
    return new Response(null, {
      status: 400,
      statusText: 'URL param employeeId must be an integer',
    })
  }

  const content = await request.json()

  const type = validateEnum<TimeClockType>(content, 'type', true, timeClockTypeValueSet)
  if (type instanceof Response) {
    return type
  }
  if (typeof type === 'undefined') {
    return new Response(null, { status: 500 })
  }

  const dateTime = validateDate(content, 'dateTime', false)
  if (dateTime instanceof Response) {
    return dateTime
  }

  try {
    await postTimeClock(employeeId, { type, dateTime, })
  } catch (error) {
    logError(error)
    return new Response(null, { status: 500 })
  }

  return new Response(null, {
    status: 201,
  })
}
