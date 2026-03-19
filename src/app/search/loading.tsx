export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[#EDEFF3] flex flex-col items-center justify-center gap-4">
      <svg className="animate-spin w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="4" />
        <path
          d="M44 24c0-11.046-8.954-20-20-20"
          stroke="#0C1628"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-[#0C1628] font-medium text-sm">Finding support workers...</p>
    </div>
  )
}
