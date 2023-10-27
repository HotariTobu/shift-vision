import logError from "@/lib/util/log-error";
import { validateDate } from "../../validate";
import { postShift } from "@/lib/shift";

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

  const startAt = validateDate(content, 'startAt', true)
  if (startAt instanceof Response) {
    return startAt
  }
  if (typeof startAt === 'undefined') {
    return new Response(null, { status: 500 })
  }

  const endAt = validateDate(content, 'endAt', true)
  if (endAt instanceof Response) {
    return endAt
  }
  if (typeof endAt === 'undefined') {
    return new Response(null, { status: 500 })
  }

  try {
    await postShift(employeeId, { startAt, endAt })
  } catch (error) {
    logError(error)
    return new Response(null, { status: 500 })
  }

  return new Response(null, {
    status: 201,
  })
}
