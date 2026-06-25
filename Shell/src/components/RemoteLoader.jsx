import React, { Suspense, lazy } from 'react'

const remoteModules = {
  'auth/AuthApp': () => import('auth/AuthApp'),
  'cleaning/Routes': () => import('cleaning/Routes'),
  'repair/Routes': () => import('repair/Routes'),
  'appliance/Routes': () => import('appliance/Routes'),
  'booking/Routes': () => import('booking/Routes'),
  'payment/Routes': () => import('payment/Routes'),
  'tracking/Routes': () => import('tracking/Routes'),
  'profile/Routes': () => import('profile/Routes'),
}

const remoteComponents = Object.fromEntries(
  Object.entries(remoteModules).map(([remote, loader]) => [remote, lazy(loader)])
)

export default function RemoteLoader({ remote, ...props }) {
  const RemoteComponent = remoteComponents[remote]

  if (!RemoteComponent) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Remote "{remote}" is not registered.
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="text-center py-8">Loading remote...</div>}>
      <RemoteComponent {...props} />
    </Suspense>
  )
}
