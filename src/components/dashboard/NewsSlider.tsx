"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Loader from "@/components/ui/Loader";
import JobCard from "@/components/dashboard/JobCard";
import ApplyModal from "@/components/dashboard/ApplyModal";

interface Job {
  id: string
  zohoId: string
  recruitmentTitle: string | null
  service: string | null
  jobDescription: string | null
  city: string | null
  state: string | null
  postedAt: string | null
  createdAt: string
}

interface NewsSliderProps {
  jobs: Job[];
  isLoading?: boolean;
  appliedJobIds?: string[];
}

const CARDS_PER_PAGE = 6; // 3 columns × 2 rows

const SERVICE_OPTIONS = [
  'Support Work',
  'Cleaning',
  'Gardening',
  'Physiotherapy',
  'Occupational Therapy',
  'Exercise Physiology',
  'Psychology',
  'Behavioural Support',
  'Social Work',
  'Speech Pathology',
  'Personal Training',
  'Nursing (RN/EN)',
  'Home Modifications',
];

export default function NewsSlider({ jobs, isLoading = false, appliedJobIds = [] }: NewsSliderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [searchArea, setSearchArea] = useState('');
  const [applyJob, setApplyJob] = useState<{ title: string; jobId: string; initialStep?: 'prompt' | 'profile' } | null>(null);
  // Optimistic set — merges server-fetched applied IDs with any applied this session
  const [localAppliedIds, setLocalAppliedIds] = useState<Set<string>>(() => new Set(appliedJobIds));

  // Restore modal from URL on mount / when jobs load (e.g. after returning from profile-building)
  useEffect(() => {
    const applyId = searchParams.get('apply');
    if (!applyId || jobs.length === 0) return;
    const job = jobs.find((j) => j.id === applyId);
    if (!job) return;
    const title =
      job.recruitmentTitle ||
      [job.service, [job.city, job.state].filter(Boolean).join(', ')].filter(Boolean).join(' - ') ||
      'Support Work';
    setApplyJob({ title, jobId: job.id, initialStep: 'profile' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setCurrentIndex(0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader size="lg" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No job listings available at the moment.</p>
      </div>
    );
  }

  // Filter jobs by selected service and/or area search
  const filteredJobs = jobs.filter((job) => {
    const matchesService = selectedService
      ? job.service?.toLowerCase().includes(selectedService.toLowerCase())
      : true;

    const matchesArea = searchArea
      ? job.city?.toLowerCase().includes(searchArea.toLowerCase()) ||
        job.state?.toLowerCase().includes(searchArea.toLowerCase())
      : true;

    return matchesService && matchesArea;
  });

  const showNavigation = filteredJobs.length > CARDS_PER_PAGE && !isMobile;
  const visibleJobs = isMobile
    ? filteredJobs
    : filteredJobs.slice(currentIndex, currentIndex + CARDS_PER_PAGE);

  const handlePrevious = () => {
    setAnimClass('animate-prev');
    setCurrentIndex((prev) => {
      const next = prev - CARDS_PER_PAGE;
      return next < 0 ? Math.max(0, filteredJobs.length - CARDS_PER_PAGE) : next;
    });
  };

  const handleNext = () => {
    setAnimClass('animate-next');
    setCurrentIndex((prev) => {
      const next = prev + CARDS_PER_PAGE;
      return next >= filteredJobs.length ? 0 : next;
    });
  };

  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    setCurrentIndex(0);
  };

  const handleAreaSearch = (value: string) => {
    setSearchArea(value);
    setCurrentIndex(0);
  };

  return (
    <>
    <div className="news-slider-wrapper">
      <div className="section-header-main">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="section-title-main">Available Jobs</h3>

          {/* Service filter dropdown */}
          <select
            value={selectedService}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All Services</option>
            {SERVICE_OPTIONS.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>

          {/* Area search input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </span>
            <input
              type="text"
              value={searchArea}
              onChange={(e) => handleAreaSearch(e.target.value)}
              placeholder="Search by area..."
              className="text-sm border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-40"
            />
          </div>
        </div>

        {showNavigation && (
          <div className="section-nav-btns">
            <button
              className="nav-arrow-btn"
              onClick={handlePrevious}
              aria-label="Previous jobs"
            >
              ←
            </button>
            <button
              className="nav-arrow-btn"
              onClick={handleNext}
              aria-label="Next jobs"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Empty state for filter */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No jobs found
            {selectedService && <> for <span className="font-medium text-gray-700">{selectedService}</span></>}
            {searchArea && <> in <span className="font-medium text-gray-700">{searchArea}</span></>}.
          </p>
        </div>
      ) : (
        <div
          className={[
            isMobile ? "course-cards-grid news-swipeable" : "course-cards-grid",
            animClass,
          ].join(' ')}
          onAnimationEnd={() => setAnimClass('')}
        >
          {visibleJobs.map((job) => {
            const title =
              job.recruitmentTitle ||
              [job.service, [job.city, job.state].filter(Boolean).join(', ')].filter(Boolean).join(' - ') ||
              'Support Work';
            return (
              <JobCard
                key={job.id}
                job={job}
                applied={localAppliedIds.has(job.id)}
                onApply={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('apply', job.id);
                  router.replace(`${pathname}?${params.toString()}`);
                  setApplyJob({ title, jobId: job.id });
                }}
              />
            );
          })}
        </div>
      )}
    </div>

    {/* Apply modal — renders the worker's profile as a resume popup */}
    {applyJob && (
      <ApplyModal
        jobTitle={applyJob.title}
        jobId={applyJob.jobId}
        initialStep={applyJob.initialStep}
        onClose={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete('apply');
          const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
          router.replace(newUrl);
          setApplyJob(null);
        }}
        onApplied={() => {
          setLocalAppliedIds((prev) => new Set([...prev, applyJob.jobId]));
          const params = new URLSearchParams(searchParams.toString());
          params.delete('apply');
          const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
          router.replace(newUrl);
          setApplyJob(null);
        }}
      />
    )}
    </>
  );
}
