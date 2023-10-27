'use client' // Error components must be Client Components

import logError from '@/lib/util/log-error'
import { useEffect } from 'react'

export default (props: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  useEffect(() => {
    // Log the error to an error reporting service
    logError(props.error)
  }, [props.error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={props.reset}>
        Try again
      </button>
    </div>
  )
}
