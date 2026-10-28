'use client'

// admin-clients U2 (A1): the Clients and the Support Coordinators tabs, one component; the role is the only difference.
// Filters and the page live in the URL (listQuery.ts); the api answers no-store, so every change is a fresh read.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { RequesterRole } from '@remonta/api-contract'
import { FUNDING_TYPES } from '@remonta/schemas/data/serviceRequests'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import { adminApi } from '@/lib/api/admin'
import { noticeText, noticeTitle } from '@/lib/api/outcome-notice'
import { SERVICE_REQUEST_STATUS_STYLE } from '@/features/service-requests/status'
import { FUNDING_LABEL } from '@/features/service-requests/funding'
import { OFFERED_STATUSES } from './statusChoices'
import { detailHref, filtersOf, listHref, REQUESTER_TABS, requestOf, type ListFilters } from './listQuery'

const LIST_NOTICE = { name: 'list', plural: 'requests' }
const SEARCH_PAUSE_MS = 350

export const requestersQueryKey = ['admin-requesters'] as const

export default function RequestersList({ role }: { role: RequesterRole }) {
  const router = useRouter()
  const params = useSearchParams()
  const { tab, title, singular } = REQUESTER_TABS[role]
  const filters = filtersOf(params)
  const [searchText, setSearchText] = useState(filters.search)

  const go = (next: ListFilters) => router.replace(listHref(tab, next), { scroll: false })

  // The search box applies after a short pause, from page 1.
  useEffect(() => {
    if (searchText.trim() === filters.search) return
    const t = setTimeout(() => go({ ...filters, search: searchText.trim(), page: 1 }), SEARCH_PAUSE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on the typed text only
  }, [searchText])

  const query = requestOf(role, filters)
  const { data: outcome, isLoading, isFetching } = useQuery({
    queryKey: [...requestersQueryKey, query],
    queryFn: () => adminApi.listRequesters(query),
    placeholderData: keepPreviousData,
  })
  const result = outcome?.kind === 'ok' ? outcome.body : undefined
  const notice = outcome && outcome.kind !== 'ok' ? outcome : null
  const isCoordinator = role === 'COORDINATOR'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-600">Each {singular} with their participants and requests. Open one to see everything.</p>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name or email"
            maxLength={100}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            aria-label="Search by name or email"
          />
          <select
            value={filters.requestStatus ?? ''}
            onChange={(e) => go({ ...filters, requestStatus: (e.target.value || undefined) as ListFilters['requestStatus'], page: 1 })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            aria-label="Request status"
          >
            <option value="">Any request status</option>
            {OFFERED_STATUSES.map((s) => (
              <option key={s} value={s}>Has a {SERVICE_REQUEST_STATUS_STYLE[s].label.toLowerCase()} request</option>
            ))}
          </select>
          <select
            value={filters.fundingType ?? ''}
            onChange={(e) => go({ ...filters, fundingType: (e.target.value || undefined) as ListFilters['fundingType'], page: 1 })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            aria-label="Funding type"
          >
            <option value="">Any funding type</option>
            {FUNDING_TYPES.map((f) => (
              <option key={f} value={f}>{FUNDING_LABEL[f]} participant</option>
            ))}
          </select>
        </div>

        {notice && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{noticeTitle(notice, LIST_NOTICE)}</p>
            <p className="mt-1 text-sm text-red-700">{noticeText(notice)}</p>
          </div>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader size="lg" /></div>
          ) : result && result.data.length === 0 ? (
            <p className="p-12 text-center text-gray-500">No {title.toLowerCase()} match.</p>
          ) : result ? (
            <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Mobile</th>
                    {isCoordinator && <th className="px-4 py-3">Organisation</th>}
                    <th className="px-4 py-3 text-right">Participants</th>
                    <th className="px-4 py-3 text-right">Requests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.data.map((r) => (
                    <tr key={r.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-indigo-700">
                        <Link href={detailHref(r.userId, tab, filters)}>{r.firstName} {r.lastName}</Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.email}</td>
                      <td className="px-4 py-3 text-gray-700">{r.mobile}</td>
                      {isCoordinator && <td className="px-4 py-3 text-gray-700">{r.organisation ?? ''}</td>}
                      <td className="px-4 py-3 text-right text-gray-700">{r.participantCount}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.requestCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {result && result.pagination.totalPages > 1 && <Pagination pagination={result.pagination} onPage={(page) => go({ ...filters, page })} />}
        </div>
      </div>
    </div>
  )
}
