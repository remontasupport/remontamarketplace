'use client'

// admin-clients U2 (A2): one client or support coordinator, their participants (the client dashboard's own card, read
// only) and each participant's requests. After a status change the detail and the lists are read again (AR-3).
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminParticipant } from '@remonta/api-contract'
import type { ServiceRequestStatus } from '@remonta/schemas/data/serviceRequests'
import Loader from '@/components/ui/Loader'
import ParticipantDetailPanel from '@/components/dashboard/client/ParticipantDetailPanel'
import { adminApi } from '@/lib/api/admin'
import { noticeText, noticeTitle } from '@/lib/api/outcome-notice'
import { FUNDING_LABEL } from '@/features/service-requests/funding'
import { REQUESTER_TABS } from './listQuery'
import RequestCard from './RequestCard'
import { requestersQueryKey } from './RequestersList'

const PAGE_NOTICE = { name: 'page', plural: 'requests' }

/** The client card's own shape, from the api's participant. */
const cardOf = (p: AdminParticipant) => ({
  id: p.id,
  name: `${p.firstName} ${p.lastName}`.trim(),
  gender: p.gender ?? undefined,
  dateOfBirth: p.dateOfBirth,
  location: p.location ?? undefined,
  fundingType: p.fundingType ?? undefined,
  relationshipToClient: p.relationshipToClient ?? undefined,
  additionalInfo: p.additionalInfo ?? undefined,
  conditions: p.conditions,
})

export default function RequesterDetail({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const queryKey = ['admin-requester', userId]
  const { data: outcome, isLoading } = useQuery({ queryKey, queryFn: () => adminApi.getRequester(userId) })

  const changeStatus = async (requestId: string, status: ServiceRequestStatus): Promise<string | null> => {
    const result = await adminApi.setRequestStatus(requestId, status)
    await Promise.all([queryClient.invalidateQueries({ queryKey }), queryClient.invalidateQueries({ queryKey: requestersQueryKey })])
    if (result.kind === 'ok') return null
    if (result.kind === 'failed' && result.status === 409) return 'This request was changed meanwhile; reloaded.'
    return `${noticeTitle(result, PAGE_NOTICE)}. ${noticeText(result)}`
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader size="lg" /></div>
  if (!outcome || outcome.kind !== 'ok') {
    const notFound = outcome?.kind === 'failed' && outcome.status === 404
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-3xl rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{notFound ? 'No client or support coordinator has this id' : outcome ? noticeTitle(outcome, PAGE_NOTICE) : 'Not loaded'}</p>
          {!notFound && outcome && <p className="mt-1 text-sm text-red-700">{noticeText(outcome)}</p>}
        </div>
      </div>
    )
  }

  const { requester: r, participants } = outcome.body
  const tabs = REQUESTER_TABS[r.role]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        <Link href={`/admin/manage?tab=${tabs.tab}`} className="text-sm text-indigo-700 hover:underline">← Back to {tabs.title}</Link>

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-xs uppercase tracking-wide text-gray-500">{tabs.singular}</p>
          <h1 className="text-2xl font-bold text-gray-900">{r.firstName} {r.lastName}</h1>
          <p className="mt-1 text-sm text-gray-700">{r.email} · {r.mobile}{r.organisation ? ` · ${r.organisation}` : ''}</p>
          <p className="mt-1 text-sm text-gray-500">{r.participantCount} participant{r.participantCount === 1 ? '' : 's'} · {r.requestCount} request{r.requestCount === 1 ? '' : 's'}</p>
        </div>

        {participants.length === 0 && <p className="rounded-lg bg-white p-6 text-center text-gray-500 shadow">No participants yet.</p>}

        {participants.map((p) => (
          <section key={p.id} className="space-y-3">
            <ParticipantDetailPanel participant={cardOf(p)} />
            <p className="text-sm text-gray-700">
              Funding: {p.fundingType ? FUNDING_LABEL[p.fundingType] : 'not given'}{p.location ? ` · ${p.location}` : ''}
            </p>
            {p.requests.length === 0 ? (
              <p className="text-sm text-gray-500">No requests for this participant.</p>
            ) : (
              p.requests.map((req) => <RequestCard key={`${req.id}-${req.status}`} request={req} onChangeStatus={changeStatus} />)
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
