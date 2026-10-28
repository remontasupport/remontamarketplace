'use client'

// admin-clients U2 (A2, D1): one page for a client or a support coordinator. `?tab=` keeps the sidebar's item lit.
import { useParams } from 'next/navigation'
import RequesterDetail from '@/features/admin-clients/RequesterDetail'

export default function RequesterPage() {
  const { userId } = useParams<{ userId: string }>()
  return <RequesterDetail userId={userId} />
}
