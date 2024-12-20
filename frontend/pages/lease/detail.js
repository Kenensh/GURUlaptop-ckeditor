import React, { useState, useEffect } from 'react'
import LeaseDetail from '@/components/lease/leaseDetail'

export default function Detail(props) {
  return (
    <>
      <LeaseDetail />
    </>
  )
}
Detail.getLayout = (page) => page
