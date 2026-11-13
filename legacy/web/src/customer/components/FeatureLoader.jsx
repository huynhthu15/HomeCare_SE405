import React, { Suspense, lazy } from 'react'

const featureComponents = {
  auth: lazy(() => import('../../features/auth/AuthApp')),
  cleaning: lazy(() => import('../../features/cleaning/Routes')),
  repair: lazy(() => import('../../features/repair/Routes')),
  appliance: lazy(() => import('../../features/appliance/Routes')),
  booking: lazy(() => import('../../features/booking/Routes')),
  payment: lazy(() => import('../../features/payment/Routes')),
  tracking: lazy(() => import('../../features/tracking/Routes')),
  profile: lazy(() => import('../../features/profile/Routes')),
}

export default function FeatureLoader({ feature, ...props }) {
  const FeatureComponent = featureComponents[feature]

  if (!FeatureComponent) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Phân hệ "{feature}" không được đăng ký.
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="py-8 text-center">Đang tải phân hệ...</div>}>
      <FeatureComponent {...props} />
    </Suspense>
  )
}
