'use client'

export default function AustraliaMap() {
  return (
    <section className="bg-gray-50 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
            <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg text-[#0C1628]">LOCATION</span>
          </p>
          <h2 className="font-cooper text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-normal leading-tight text-[#0C1628] mb-6 sm:mb-8">
            Find independent support workers<br />in popular regions
          </h2>
        </div>

        {/* Map Container */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-7xl">
            {/* Australia SVG from file */}
            <div className="relative">
              <img
                src="/images/australia.svg"
                alt="Australia map"
                className="w-full h-auto"
              />

              {/* Sydney pin overlay - clickable */}
              <button
                className="absolute group cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
                style={{
                  left: '79%',
                  top: '65%',
                  transform: 'translate(-50%, -100%)'
                }}
                onClick={() => {
                  window.location.href = '/team/sydney';
                }}
                aria-label="View Sydney team members"
              >
                <div
                  className="absolute rounded-full bg-black opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{
                    width: '20px',
                    height: '8px',
                    left: '50%',
                    top: '38px',
                    transform: 'translateX(-50%)'
                  }}
                />
                <svg width="32" height="40" viewBox="0 0 32 40" className="relative drop-shadow-md">
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                    fill="#DC2626"
                    className="group-hover:fill-red-700 transition-colors"
                  />
                  <circle cx="16" cy="16" r="8" fill="white" />
                </svg>
                <div
                  className="absolute bg-white border border-gray-300 px-2 py-1 rounded shadow-sm group-hover:shadow-md transition-shadow"
                  style={{
                    left: '32px',
                    top: '15px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="text-xs font-medium text-gray-800 group-hover:text-red-600 transition-colors">
                    Sydney
                  </span>
                </div>
              </button>

              {/* Melbourne pin */}
              <button
                className="absolute group cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
                style={{
                  left: '73%',
                  top: '78%',
                  transform: 'translate(-50%, -100%)'
                }}
                onClick={() => {
                  window.location.href = '/team/melbourne';
                }}
                aria-label="View Melbourne team members"
              >
                <div
                  className="absolute rounded-full bg-black opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{
                    width: '20px',
                    height: '8px',
                    left: '50%',
                    top: '38px',
                    transform: 'translateX(-50%)'
                  }}
                />
                <svg width="32" height="40" viewBox="0 0 32 40" className="relative drop-shadow-md">
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                    fill="#DC2626"
                    className="group-hover:fill-red-700 transition-colors"
                  />
                  <circle cx="16" cy="16" r="8" fill="white" />
                </svg>
                <div
                  className="absolute bg-white border border-gray-300 px-2 py-1 rounded shadow-sm group-hover:shadow-md transition-shadow"
                  style={{
                    left: '28px',
                    top: '25px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="text-xs font-medium text-gray-800 group-hover:text-red-600 transition-colors">
                    Melbourne
                  </span>
                </div>
              </button>

              {/* Adelaide pin */}
              <button
                className="absolute group cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
                style={{
                  left: '67%',
                  top: '72%',
                  transform: 'translate(-50%, -100%)'
                }}
                onClick={() => {
                  window.location.href = '/team/adelaide';
                }}
                aria-label="View Adelaide team members"
              >
                <div
                  className="absolute rounded-full bg-black opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{
                    width: '20px',
                    height: '8px',
                    left: '50%',
                    top: '38px',
                    transform: 'translateX(-50%)'
                  }}
                />
                <svg width="32" height="40" viewBox="0 0 32 40" className="relative drop-shadow-md">
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                    fill="#DC2626"
                    className="group-hover:fill-red-700 transition-colors"
                  />
                  <circle cx="16" cy="16" r="8" fill="white" />
                </svg>
                <div
                  className="absolute bg-white border border-gray-300 px-2 py-1 rounded shadow-sm group-hover:shadow-md transition-shadow"
                  style={{
                    left: '20px',
                    top: '-32px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="text-xs font-medium text-gray-800 group-hover:text-red-600 transition-colors">
                    Adelaide
                  </span>
                </div>
              </button>

              {/* Brisbane pin */}
              <button
                className="absolute group cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
                style={{
                  left: '80%',
                  top: '50%',
                  transform: 'translate(-50%, -100%)'
                }}
                onClick={() => {
                  window.location.href = '/team/brisbane';
                }}
                aria-label="View Brisbane team members"
              >
                <div
                  className="absolute rounded-full bg-black opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{
                    width: '20px',
                    height: '8px',
                    left: '50%',
                    top: '38px',
                    transform: 'translateX(-50%)'
                  }}
                />
                <svg width="32" height="40" viewBox="0 0 32 40" className="relative drop-shadow-md">
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                    fill="#DC2626"
                    className="group-hover:fill-red-700 transition-colors"
                  />
                  <circle cx="16" cy="16" r="8" fill="white" />
                </svg>
                <div
                  className="absolute bg-white border border-gray-300 px-2 py-1 rounded shadow-sm group-hover:shadow-md transition-shadow"
                  style={{
                    left: '32px',
                    top: '-14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="text-xs font-medium text-gray-800 group-hover:text-red-600 transition-colors">
                    Brisbane
                  </span>
                </div>
              </button>

              {/* Perth pin */}
              <button
                className="absolute group cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
                style={{
                  left: '31%',
                  top: '69%',
                  transform: 'translate(-50%, -100%)'
                }}
                onClick={() => {
                  window.location.href = '/team/perth';
                }}
                aria-label="View Perth team members"
              >
                <div
                  className="absolute rounded-full bg-black opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{
                    width: '20px',
                    height: '8px',
                    left: '50%',
                    top: '38px',
                    transform: 'translateX(-50%)'
                  }}
                />
                <svg width="32" height="40" viewBox="0 0 32 40" className="relative drop-shadow-md">
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                    fill="#DC2626"
                    className="group-hover:fill-red-700 transition-colors"
                  />
                  <circle cx="16" cy="16" r="8" fill="white" />
                </svg>
                <div
                  className="absolute bg-white border border-gray-300 px-2 py-1 rounded shadow-sm group-hover:shadow-md transition-shadow"
                  style={{
                    left: '25px',
                    top: '-28px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="text-xs font-medium text-gray-800 group-hover:text-red-600 transition-colors">
                    Perth
                  </span>
                </div>
              </button>

              {/* Newcastle pin */}
              <button
                className="absolute group cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
                style={{
                  left: '81%',
                  top: '60%',
                  transform: 'translate(-50%, -100%)'
                }}
                onClick={() => {
                  window.location.href = '/team/newcastle';
                }}
                aria-label="View Newcastle team members"
              >
                <div
                  className="absolute rounded-full bg-black opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{
                    width: '20px',
                    height: '8px',
                    left: '50%',
                    top: '38px',
                    transform: 'translateX(-50%)'
                  }}
                />
                <svg width="32" height="40" viewBox="0 0 32 40" className="relative drop-shadow-md">
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                    fill="#DC2626"
                    className="group-hover:fill-red-700 transition-colors"
                  />
                  <circle cx="16" cy="16" r="8" fill="white" />
                </svg>
                <div
                  className="absolute bg-white border border-gray-300 px-2 py-1 rounded shadow-sm group-hover:shadow-md transition-shadow"
                  style={{
                    left: '32px',
                    top: '-16px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="text-xs font-medium text-gray-800 group-hover:text-red-600 transition-colors">
                    Newcastle
                  </span>
                </div>
              </button>

              {/* Canberra pin */}
              <button
                className="absolute group cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
                style={{
                  left: '77%',
                  top: '70%',
                  transform: 'translate(-50%, -100%)'
                }}
                onClick={() => {
                  window.location.href = '/team/canberra';
                }}
                aria-label="View Canberra team members"
              >
                <div
                  className="absolute rounded-full bg-black opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{
                    width: '20px',
                    height: '8px',
                    left: '50%',
                    top: '38px',
                    transform: 'translateX(-50%)'
                  }}
                />
                <svg width="32" height="40" viewBox="0 0 32 40" className="relative drop-shadow-md">
                  <path
                    d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
                    fill="#DC2626"
                    className="group-hover:fill-red-700 transition-colors"
                  />
                  <circle cx="16" cy="16" r="8" fill="white" />
                </svg>
                <div
                  className="absolute bg-white border border-gray-300 px-2 py-1 rounded shadow-sm group-hover:shadow-md transition-shadow"
                  style={{
                    left: '24px',
                    top: '29px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="text-xs font-medium text-gray-800 group-hover:text-red-600 transition-colors">
                    Canberra
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Additional info */}
      </div>
    </section>
  )
}