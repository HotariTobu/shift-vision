import { getEmployee, getEmployees, getTimeClocks } from "@/lib/freee/hr"
import Employee from "@/lib/freee/types/employee"
import { TimeClock, getTimeClockMap } from "@/lib/shift"
import { groupByAsync } from "@/lib/util/group-by"
import minOf from "@/lib/util/min-of"
import NextResult from "@/lib/util/next-result"

const TIME_CLOCK_THRESHOLD = 2 * 60 * 60 * 1000
const TIME_CLOCK_MARGIN = 30 * 60 * 1000

export class TimeClockError {
  private __dateTime: Date

  public get dateTime() {
    return this.__dateTime
  }

  public constructor(
    public plan: TimeClock | null,
    public fact: TimeClock | null,
  ) {
    const timeClock = plan ?? fact
    if (timeClock === null) {
      throw new Error('Both plan and fact were null.')
    }

    this.__dateTime = timeClock.dateTime
  }
}

interface EmployeeWithErrors {
  employee: Employee
  errors: AsyncGenerator<TimeClockError>
}

const timeClockErrorGenerator = async function* (plans: IterableIterator<TimeClock>, facts: AsyncIterableIterator<TimeClock>): AsyncGenerator<TimeClockError> {
  let { value: plan, done: planDone }: NextResult<TimeClock> = plans.next()
  let { value: fact, done: factDone }: NextResult<TimeClock> = await facts.next()

  const updatePlan = () => {
    const ite = plans.next()
    plan = ite.value
    planDone = ite.done
  }

  const updateFact = async () => {
    const ite = await facts.next()
    fact = ite.value
    factDone = ite.done
  }

  while (!planDone && !factDone) {
    const sub = plan.dateTime.getTime() - fact.dateTime.getTime()
    const dif = Math.abs(sub)

    const next = (both = false) => {
      if (both) {
        updatePlan()
        updateFact()
        return new TimeClockError(plan, fact)
      }
      else {
        if (sub < 0) {
          updatePlan()
          return new TimeClockError(plan, null)
        }
        else {
          updateFact()
          return new TimeClockError(null, fact)
        }
      }
    }

    if (dif > TIME_CLOCK_THRESHOLD) {
      yield next()
    }
    else if (plan.type !== fact.type) {
      yield next()
    }
    else if (dif > TIME_CLOCK_MARGIN) {
      yield next(true)
    }
    else {
      next(true)
    }
  }

  if (!planDone) {
    const now = new Date()

    const planList = [plan, ...plans]
    for (const plan of planList) {
      if (plan.dateTime > now) {
        break
      }

      yield new TimeClockError(plan, null)
    }
  }

  if (!factDone) {
    const factList = [fact]
    for await (const fact of facts) {
      factList.push(fact)
    }

    for (const fact of factList) {
      yield new TimeClockError(null, fact)
    }
  }
}

const selectTimeClocks = async function* (employeeId: number): AsyncGenerator<TimeClock> {
  const timeClocks = await getTimeClocks(employeeId)
  for (const timeClock of timeClocks) {
    yield {
      type: timeClock.type,
      dateTime: timeClock.datetime,
    }
  }
}

const getTimeClockErrorsOf = async (employeeId: number): Promise<EmployeeWithErrors | null> => {
  const employee = await getEmployee(employeeId)
  if (employee === null) {
    return null
  }

  const planMap = await getTimeClockMap(employeeId)
  const plans = planMap.get(employeeId) ?? [].values()
  const facts = selectTimeClocks(employeeId)

  const errors = timeClockErrorGenerator(plans, facts)
  return {
    employee,
    errors,
  }
}

const getTimeClockErrorMap = async () => {
  const errorMap = new Map<number, EmployeeWithErrors>()

  const planMap = await getTimeClockMap()

  const employees = await getEmployees()
  for (const employee of employees) {
    const employeeId = employee.id

    const plans = planMap.get(employeeId) ?? [].values()
    const facts = selectTimeClocks(employeeId)

    const errors = timeClockErrorGenerator(plans, facts)
    errorMap.set(employeeId, {
      employee,
      errors,
    })
  }

  return errorMap
}

const getTimeClockErrors = async function* () {
  const errorMap = await getTimeClockErrorMap()

  const currentErrorMap = new Map<number, TimeClockError>()

  const deletedKeys = []

  for (const [key, value] of errorMap) {
    const { value: error, done }: NextResult<TimeClockError> = await value.errors.next()

    if (done) {
      deletedKeys.push(key)
    }
    else {
      currentErrorMap.set(key, error)
    }
  }

  for (const key of deletedKeys) {
    errorMap.delete(key)
  }

  while (errorMap.size > 0) {
    const [key, value] = minOf(errorMap.entries(), (a, b) => {
      const timeA = currentErrorMap.get(a[0])?.dateTime?.getTime()
      const timeB = currentErrorMap.get(b[0])?.dateTime?.getTime()

      if (typeof timeA === 'undefined' || typeof timeB === 'undefined') {
        return 0
      }

      return timeA - timeB
    })

    const { value: error, done }: NextResult<TimeClockError> = await value.errors.next()
    const currentError = currentErrorMap.get(key)
    if (typeof currentError === 'undefined') {
      continue
    }

    yield {
      employee: value.employee,
      error: currentError,
    }

    if (done) {
      errorMap.delete(key)
      currentErrorMap.delete(key)
    }
    else {
      currentErrorMap.set(key, error)
    }
  }
}

export const getTimeClockErrorsByDate = async () => {
  const extractDate = (dateTime: Date) => new Date(
    dateTime.getFullYear(),
    dateTime.getMonth(),
    dateTime.getDate()
  )

  const errors = getTimeClockErrors()
  return groupByAsync(errors, e => extractDate(e.error.dateTime))
}
