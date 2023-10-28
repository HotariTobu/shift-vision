import { getEmployee, getEmployees, getTimeClocks } from "@/lib/freee/hr"
import Employee from "@/lib/freee/types/employee"
import { TimeClock, getTimeClockMap } from "@/lib/shift"
import { groupByAsync } from "@/lib/util/group-by"
import { mapMapKeys } from "@/lib/util/map-map"
import minOf from "@/lib/util/min-of"
import NextResult from "@/lib/util/next-result"

const TIME_CLOCK_THRESHOLD = 2 * 60 * 60 * 1000
const TIME_CLOCK_MARGIN = 30 * 60 * 1000

class TimeClockError {
  public readonly dateTime: Date

  public constructor(
    public readonly plan: TimeClock | null,
    public readonly fact: TimeClock | null,
  ) {
    const timeClock = plan ?? fact
    if (timeClock === null) {
      throw new Error('Both plan and fact were null.')
    }

    this.dateTime = timeClock.dateTime
  }
}

interface EmployeeWithErrors {
  employee: Employee
  errors: IterableIterator<TimeClockError>
}

const timeClockErrorGenerator = function* (plans: IterableIterator<TimeClock>, facts: IterableIterator<TimeClock>) {
  let { value: plan, done: planDone }: NextResult<TimeClock> = plans.next()
  let { value: fact, done: factDone }: NextResult<TimeClock> = facts.next()

  const updatePlan = () => {
    const ite = plans.next()
    plan = ite.value
    planDone = ite.done
  }

  const updateFact = () => {
    const ite = facts.next()
    fact = ite.value
    factDone = ite.done
  }

  while (!planDone && !factDone) {
    const sub = plan.dateTime.getTime() - fact.dateTime.getTime()
    const dif = Math.abs(sub)

    const next = (both = false) => {
      if (both) {
        const error = new TimeClockError(plan, fact)
        updatePlan()
        updateFact()
        return error
      }
      else {
        if (sub < 0) {
          const error = new TimeClockError(plan, null)
          updatePlan()
          return error
        }
        else {
          const error = new TimeClockError(null, fact)
          updateFact()
          return error
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
    const factList = [fact, ...facts]
    for (const fact of factList) {
      yield new TimeClockError(null, fact)
    }
  }
}

const reduceErrors = (errors: Iterable<TimeClockError>) => {
  interface HalfError {
    planNull: boolean
    timeClock: TimeClock
  }

  const halfErrorGroups: HalfError[][] = [[]]

  const result: TimeClockError[] = []
  let lastGroup = halfErrorGroups[0]

  const addGroup = () => {
    const length = halfErrorGroups.push([])
    lastGroup = halfErrorGroups[length - 1]
  }

  for (const error of errors) {
    const planNull = error.plan === null
    const factNull = error.fact === null

    if (planNull === factNull) {
      result.push(error)
      addGroup()
    }
    else {
      const lastError = lastGroup[lastGroup.length - 1]

      if (lastError && lastError.planNull === planNull) {
        addGroup()
      }

      lastGroup.push({
        planNull,
        timeClock: (factNull ? error.plan : error.fact) as TimeClock
      })
    }
  }

  while (true) {
    const group = halfErrorGroups.shift()
    if (typeof group === 'undefined') {
      break
    }

    if (group.length < 2) {
      result.push(...group.map(({ planNull, timeClock }) => {
        if (planNull) {
          return new TimeClockError(null, timeClock)
        }
        else {
          return new TimeClockError(timeClock, null)
        }
      }))

      continue
    }


    let lastError = group[0]

    const diffs: number[] = []

    for (let i = 1; i < group.length; i++) {
      const error = group[i]
      const sub = error.timeClock.dateTime.getTime() - lastError.timeClock.dateTime.getTime()
      const dif = Math.abs(sub)
      diffs.push(dif)
    }

    const min = minOf(diffs, (a, b) => a - b)
    if (min === null) {
      continue
    }

    halfErrorGroups.push(group.splice(0, min.index))
    const pair = group.splice(0, 2)
    halfErrorGroups.push(group)

    if (pair[0].planNull) {
      pair.reverse()
    }

    result.push(new TimeClockError(pair[0].timeClock, pair[1].timeClock))
  }

  result.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())

  return result.values()
}

const getDateRange = (params: {
  year: number
  month: number
}) => {
  const fromDate = new Date(params.year, params.month - 1)
  const toDate = new Date(params.year, params.month, 0)
  const now = new Date()

  if (toDate < now) {
    return {
      fromDate,
      toDate,
    }
  }
  else {
    return {
      fromDate,
      toDate: now,
    }
  }
}

const selectTimeClocks = async (employeeId: number, params: {
  fromDate: Date
  toDate: Date
}) => {
  const timeClocks = await getTimeClocks(employeeId, {
    from_date: params.fromDate,
    to_date: params.toDate,
  })

  return timeClocks.map(timeClock => ({
    type: timeClock.type,
    dateTime: timeClock.datetime,
  })).values()
}

const getTimeClockErrorsOf = async (employeeId: number, params: {
  year: number
  month: number
}): Promise<EmployeeWithErrors | null> => {
  const employee = await getEmployee(employeeId, params)
  if (employee === null) {
    return null
  }

  const dateRange = getDateRange(params)

  const planMap = await getTimeClockMap({
    employeeIds: employeeId,
    ...dateRange,
  })
  const plans = planMap.get(employeeId) ?? [].values()
  const facts = await selectTimeClocks(employeeId, dateRange)

  const errors = timeClockErrorGenerator(plans, facts)
  return {
    employee,
    errors: reduceErrors(errors),
  }
}

const getTimeClockErrorMap = async (params: {
  year: number
  month: number
}) => {
  const dateRange = getDateRange(params)
  const errorMap = new Map<number, EmployeeWithErrors>()

  const planMap = await getTimeClockMap(dateRange)

  const employees = await getEmployees()
  for (const employee of employees) {
    const employeeId = employee.id

    const plans = planMap.get(employeeId) ?? [].values()
    const facts = await selectTimeClocks(employeeId, dateRange)

    const errors = timeClockErrorGenerator(plans, facts)
    errorMap.set(employeeId, {
      employee,
      errors: reduceErrors(errors),
    })
  }

  return errorMap
}

const getTimeClockErrors = async function* (params: {
  year: number
  month: number
}) {
  const errorMap = await getTimeClockErrorMap(params)

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

  while (true) {
    const min = minOf(errorMap.entries(), (a, b) => {
      const timeA = currentErrorMap.get(a[0])?.dateTime?.getTime()
      const timeB = currentErrorMap.get(b[0])?.dateTime?.getTime()

      if (typeof timeA === 'undefined' || typeof timeB === 'undefined') {
        return 0
      }

      return timeA - timeB
    })

    if (min === null) {
      break
    }

    const [key, value] = min.value

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

export const getTimeClockErrorsByDate = async (params: {
  year: number
  month: number
}) => {
  const extractDate = (dateTime: Date) => new Date(
    dateTime.getFullYear(),
    dateTime.getMonth(),
    dateTime.getDate()
  ).getTime()

  const errors = getTimeClockErrors(params)
  const timeClockErrorsByDate = await groupByAsync(errors, e => extractDate(e.error.dateTime))

  return mapMapKeys(timeClockErrorsByDate, k => new Date(k))
}
