import { TimeClockType } from "./freee/types/time-clock"
import prisma from "./prisma"
import { groupBy } from "./util/group-by"
import { mapMapValues } from "./util/map-map"

export interface Shift {
  startAt: Date
  endAt: Date
}

export interface TimeClock {
  type: TimeClockType
  dateTime: Date
}

const MAX_BREAK_MILLISECONDS = 60 * 60 * 1000

const timeClockGenerator = function* (shifts: Shift[]): Generator<TimeClock> {
  const len = shifts.length
  if (len === 0) {
    return
  }

  let shift0 = shifts[0]

  yield {
    type: 'clock_in',
    dateTime: shift0.startAt,
  }

  for (let i = 1; i < len; i++) {
    const shift1 = shifts[i]

    let breakMilliseconds = shift1.startAt.getTime() - shift0.endAt.getTime()
    if (MAX_BREAK_MILLISECONDS < breakMilliseconds) {
      yield {
        type: 'clock_out',
        dateTime: shift0.endAt,
      }
      yield {
        type: 'clock_in',
        dateTime: shift1.startAt,
      }
    }
    else {
      yield {
        type: 'break_begin',
        dateTime: shift0.endAt,
      }
      yield {
        type: 'break_end',
        dateTime: shift1.startAt,
      }
    }

    shift0 = shift1
  }

  yield {
    type: 'clock_out',
    dateTime: shift0.endAt,
  }
}

export const getShiftMap = async (params?: {
  employeeIds?: number | number[]
  fromDate?: Date
  toDate?: Date
  limit?: number
  offset?: number
}) => {
  const rows = await prisma.shift.findMany({
    where: {
      employeeId: Array.isArray(params?.employeeIds) ? {
        in: params?.employeeIds
      } : params?.employeeIds,
      startAt: {
        gt: params?.fromDate,
        lt: params?.toDate,
      }
    },
    select: {
      employeeId: true,
      startAt: true,
      endAt: true,
    },
    orderBy: {
      startAt: 'asc',
    },
    take: params?.limit,
    skip: params?.offset,
  })

  return groupBy(rows, s => s.employeeId)
}

export const getTimeClockMap = async (params?: {
  employeeIds?: number | number[]
  fromDate?: Date
  toDate?: Date
  limit?: number
  offset?: number
}) => {
  const shiftMap = await getShiftMap(params)
  return mapMapValues(shiftMap, timeClockGenerator)
}

export const postShift = async (employeeId: number, shift: Shift) => {
  if (shift.startAt > shift.endAt) {
    throw new Error('startAt must be earlier than endAt.')
  }

  await prisma.shift.create({
    data: {
      employeeId,
      ...shift,
    },
  })
}
