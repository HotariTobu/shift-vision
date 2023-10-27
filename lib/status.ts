import { TimeClockType } from "./freee/types/time-clock"
import prisma from "./prisma"

export const getStatuss = async (employeeId: number) => {
  const result = await prisma.status.findFirst({
    where: {
      employeeId,
    },
    select: {
      status: true,
    },
  })

  if (result === null) {
    return 'clock_out'
  }
  else {
    return result.status as TimeClockType
  }
}

export const postStatus = async (employeeId: number, status: TimeClockType) => {
  await prisma.status.upsert({
    where: {
      employeeId,
    },
    create: {
      employeeId,
      status,
    },
    update: {
      status,
    },
  })
}
