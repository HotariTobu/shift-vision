import { company_id, get, post } from './request'
import Employee from './types/employee'
import TimeClock, { TimeClockType } from './types/time-clock'

const BASE_URI_HR = 'https://api.freee.co.jp/hr'

// #region Local functions
const toDateString = (dt: Date) => {
  const year = dt.getFullYear()
  const month = (dt.getMonth() + 1).toString().padStart(2, '0')
  const date = dt.getDate().toString().padStart(2, '0')

  return `${year}-${month}-${date}`
}

const toTimeString = (dt: Date) => {
  const hour = dt.getHours().toString().padStart(2, '0')
  const minutes = dt.getMinutes().toString().padStart(2, '0')
  const seconds = dt.getSeconds().toString().padStart(2, '0')

  return `${hour}:${minutes}:${seconds}`
}

const toDateTimeString = (dt: Date) => {
  return `${toDateString(dt)} ${toTimeString(dt)}`
}

const parseTimeClock = (timeClock: TimeClock) => {
  timeClock.datetime = new Date(timeClock.datetime)
  timeClock.original_datetime = new Date(timeClock.original_datetime)
}
// #endregion

// #region Time clock
const timeClockTag = 'time-clock'

export const getTimeClocks = async (employeeId: number, params?: {
  from_date?: Date,
  to_date?: Date,
  limit?: number,
  offset?: number,
}) => {
  const uri = `${BASE_URI_HR}/api/v1/employees/${employeeId}/time_clocks`
  const query = {
    company_id,
    ...params,
    from_date: params?.from_date && toDateString(params.from_date),
    to_date: params?.to_date && toDateString(params.to_date),
  }

  const { data } = await get<TimeClock[]>(uri, query, timeClockTag)

  data?.forEach(parseTimeClock)

  return data ?? null
}

export const postTimeClock = async (employeeId: number, params: {
  type: TimeClockType,
  dateTime?: Date,
}) => {
  const dateTime = params.dateTime ?? new Date()

  const uri = `${BASE_URI_HR}/api/v1/employees/${employeeId}/time_clocks`
  const query = {
    company_id,
    ...params,
    datetime: toDateTimeString(dateTime)
  }

  delete query.dateTime

  const { data } = await post<{
    employee_time_clock: TimeClock
  }>(uri, query, timeClockTag)

  data && parseTimeClock(data.employee_time_clock)

  return data ?? null
}
// #endregion

// #region Employee
const employeeTag = 'employee'

export const getEmployees = async (params?: {
  year?: number,
  month?: number,
  limit?: number,
  offset?: number,
}) => {
  const now = new Date()

  const uri = `${BASE_URI_HR}/api/v1/employees`
  const query = {
    company_id,
    ...params,
    year: params?.year ?? now.getFullYear(),
    month: params?.month ?? (now.getMonth() + 1),
  }

  const { data } = await get<{
    employees: Employee[],
    total_count: number
  }>(uri, query, employeeTag)

  return data?.employees ?? null
}

export const getEmployee = async (employeeId: number, params?: {
  year?: number,
  month?: number,
}) => {
  const now = new Date()

  const uri = `${BASE_URI_HR}/api/v1/employees/${employeeId}`
  const query = {
    company_id,
    ...params,
    year: params?.year ?? now.getFullYear(),
    month: params?.month ?? (now.getMonth() + 1),
  }

  const { data } = await get<{
    employee: Employee
  }>(uri, query, employeeTag)

  return data?.employee ?? null
}
// #endregion
