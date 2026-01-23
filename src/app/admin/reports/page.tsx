import { redirect } from 'next/navigation'

export default function ReportsPage() {
  redirect('/admin/manage?tab=reports')
}
