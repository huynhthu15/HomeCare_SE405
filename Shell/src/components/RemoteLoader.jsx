import React, { Suspense, lazy } from 'react'

export default function RemoteLoader({ remote }) {
  const RemoteComponent = lazy(() => import(/* @vite-ignore */ remote))

  return (
    <Suspense fallback={<div className="text-center py-8">Loading remote...</div>}>
      <RemoteComponent />
    </Suspense>
  )
}
