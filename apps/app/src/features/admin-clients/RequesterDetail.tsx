'use client'

// admin-clients U2 (A2): one client or support coordinator, their participants (the client dashboard's own card, read
// only) and each participant's requests. After a status change the detail and the lists are read again (AR-3).
// Previous / next (and the arrow keys) walk the list the record was opened from (useNeighbours).
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminParticipant } from '@remonta/api-contract'
import type { ServiceRequestStatus } from '@remonta/schemas/data/serviceRequests'
import Loader from '@/components/ui/Loader'
import ParticipantDetailPanel from '@/components/dashboard/client/ParticipantDetailPanel'
import { adminApi } from '@/lib/api/admin'
import { noticeText, noticeTitle } from '@/lib/api/outcome-notice'
import { FUNDING_LABEL } from '@/features/service-requests/funding'
import { detailHref, listHref, REQUESTER_TABS } from './listQuery'
import RequestCard from './RequestCard'
import { requestersQueryKey } from './RequestersList'
import { useNeighbours } from './useNeighbours'

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
  const router = useRouter()
  const nav = useNeighbours(userId, useSearchParams())
  const hrefOf = (n: { userId: string; page: number } | undefined) => (n && nav.tab ? detailHref(n.userId, nav.tab, { ...nav.filters, page: n.page }) : undefined)
  const prevHref = hrefOf(nav.prev)
  const nextHref = hrefOf(nav.next)

  // The arrow keys, except while typing or choosing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.altKey || e.ctrlKey || e.metaKey || (t && ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName))) return
      const href = e.key === 'ArrowLeft' ? prevHref : e.key === 'ArrowRight' ? nextHref : undefined
      if (href) router.push(href)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prevHref, nextHref, router])

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
  const arrow = 'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={listHref(nav.tab ?? tabs.tab, nav.filters)} className="text-sm text-indigo-700 hover:underline">← Back to {tabs.title}</Link>
          {nav.position && (
            <div className="flex items-center gap-2">
              {prevHref ? <Link href={prevHref} className={`${arrow} hover:bg-gray-50`} aria-label={`Previous ${tabs.singular}`}>‹ Previous</Link> : <span className={`${arrow} opacity-40`}>‹ Previous</span>}
              <span className="text-sm text-gray-600">{nav.position.index} of {nav.position.total}</span>
              {nextHref ? <Link href={nextHref} className={`${arrow} hover:bg-gray-50`} aria-label={`Next ${tabs.singular}`}>Next ›</Link> : <span className={`${arrow} opacity-40`}>Next ›</span>}
            </div>
          )}
        </div>

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
