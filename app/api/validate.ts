import isInvalidDate from "@/lib/util/is-invalid-date"

interface Content {
  [name: string]: string | undefined
}

export const validateDate = (content: Content, name: string, required: boolean) => {
  const value = content[name]

  if (typeof value === 'undefined') {
    if (required) {
      return new Response(null, {
        status: 400,
        statusText: `${name} is required.`,
      })
    }
    else {
      return value
    }
  }
  else {
    const date = new Date(value)

    if (isInvalidDate(date)) {
      return new Response(null, {
        status: 400,
        statusText: `${name} must be formatted like YYYY-MM-DDTHH:mm:ss.sssZ.`,
      })
    }
    else {
      return date
    }
  }
}

export const validateEnum = <T>(content: Content, name: string, required: boolean, values: Set<string>) => {
  const value = content[name]

  if (typeof value === 'undefined') {
    if (required) {
      return new Response(null, {
        status: 400,
        statusText: `${name} is required.`,
      })
    }
    else {
      return value
    }
  }
  else {
    if (values.has(value)) {
      return value as T
    }
    else {
      return new Response(null, {
        status: 400,
        statusText: `${name} must be one of [${[...values].join(', ')}].`,
      })
    }
  }
}
