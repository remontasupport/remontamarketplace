'use client'

import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { XCircleIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useWorkerProfile } from '@/hooks/queries/useWorkerProfile'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import { parseSetupProgress, type SetupProgress } from '@/types/setupProgress'
import { BRAND_COLORS } from '@/constants'

interface ChecklistItem {
  id: string
  label: string
  isCompleted: boolean
}

interface ProfileCompletionReminderProps {
  // Server-side calculated setupProgress for instant rendering (no fetch delay)
  initialSetupProgress?: SetupProgress
}

export default function ProfileCompletionReminder({ initialSetupProgress }: ProfileCompletionReminderProps) {
  // Get session and profile data for real-time updates
  const { data: session } = useSession()
  const router = useRouter()

  // Congratulations modal state
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false)

  // Auto-refresh state: Poll for 10 seconds after mount to catch background updates
  const [enablePolling, setEnablePolling] = useState(true)

  // Stop polling after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnablePolling(false)
    }, 10000) // 10 seconds

    return () => clearTimeout(timer)
  }, [])

  // Fetch profile data with smart polling
  const { data: profileData, isLoading } = useWorkerProfile(session?.user?.id, {
    // Poll every 2 seconds for the first 10 seconds to catch background updates
    refetchInterval: enablePolling ? 2000 : false,
    // Always refetch on mount to get fresh data
    refetchOnMount: 'always',
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
  })

  // ADVANCED HYDRATION: Use server data for instant render, then hydrate with real-time client data
  // This eliminates the delay on login while maintaining real-time updates
  const setupProgress = useMemo(() => {
    // Priority 1: Use fresh client data if available (real-time updates)
    if (profileData?.setupProgress) {
      return parseSetupProgress(profileData.setupProgress)
    }

    // Priority 2: Use server-side initial data for instant rendering (no delay)
    if (initialSetupProgress) {
      return initialSetupProgress
    }

    // Priority 3: Fallback to defaults
    return {
      accountDetails: false,
      compliance: false,
      trainings: false,
      services: false,
    }
  }, [profileData?.setupProgress, initialSetupProgress])

  // Map setupProgress to checklist items
  const checklistItems: ChecklistItem[] = useMemo(() => [
    {
      id: 'account-details',
      label: 'Account Details',
      isCompleted: setupProgress.accountDetails,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      isCompleted: setupProgress.compliance,
    },
    {
      id: 'trainings',
      label: 'Trainings',
      isCompleted: setupProgress.trainings,
    },
    {
      id: 'services',
      label: 'My Services',
      isCompleted: setupProgress.services,
    },
  ], [setupProgress])

  // Determine the next incomplete step URL
  const getNextIncompleteStepUrl = useMemo(() => {
    // Priority order: Account Details → Compliance → Trainings → Services
    if (!setupProgress.accountDetails) {
      return '/dashboard/worker/account/setup?step=name'
    }
    if (!setupProgress.compliance) {
      return '/dashboard/worker/requirements/setup'
    }
    if (!setupProgress.trainings) {
      return '/dashboard/worker/trainings/setup'
    }
    if (!setupProgress.services) {
      return '/dashboard/worker/services/setup'
    }
    // All complete - fallback to account setup
    return '/dashboard/worker/account/setup?step=name'
  }, [setupProgress])

  // Handle resume button click
  const handleResumeSetup = () => {
    router.push(getNextIncompleteStepUrl)
  }

  // Calculate completion percentage
  const completedCount = checklistItems.filter(item => item.isCompleted).length
  const totalCount = checklistItems.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Detect when setup is completed and show congratulations modal
  useEffect(() => {
    if (completionPercentage === 100 && session?.user?.id) {
      // Check if we've already shown the modal for this user
      const modalShownKey = `congratulations-modal-shown-${session.user.id}`
      const hasShownModal = localStorage.getItem(modalShownKey)

      if (!hasShownModal) {
        setShowCongratulationsModal(true)
        localStorage.setItem(modalShownKey, 'true')
      }
    }
  }, [completionPercentage, session?.user?.id])

  // ADVANCED UX: Only hide if 100% complete
  // We have server data, so no need to hide during loading (instant render!)
  if (completionPercentage === 100) {
    return (
      <>
        {/* Congratulations Modal */}
        {showCongratulationsModal && (
          <div className="modal-overlay" onClick={() => setShowCongratulationsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowCongratulationsModal(false)}
                aria-label="Close modal"
              >
                <XMarkIcon className="close-icon" />
              </button>

              <div className="modal-icon">
                <CheckCircleIcon className="success-icon" />
              </div>

              <h2 className="modal-title">Congratulations!</h2>

              <p className="modal-message">
                You have completed your account setup. Someone from our team will verify your documents shortly.
              </p>

              <button
                className="modal-button"
                onClick={() => setShowCongratulationsModal(false)}
              >
                Got it
              </button>
            </div>

            <style jsx>{`
              .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 1rem;
                animation: fadeIn 0.2s ease-out;
              }

              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }

              .modal-content {
                background: white;
                border-radius: 16px;
                padding: 2rem;
                max-width: 500px;
                width: 100%;
                position: relative;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                animation: slideUp 0.3s ease-out;
                text-align: center;
              }

              @keyframes slideUp {
                from {
                  transform: translateY(20px);
                  opacity: 0;
                }
                to {
                  transform: translateY(0);
                  opacity: 1;
                }
              }

              .modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 8px;
                transition: background 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .modal-close:hover {
                background: #f3f4f6;
              }

              .modal-close :global(.close-icon) {
                width: 24px;
                height: 24px;
                color: #6b7280;
              }

              .modal-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 1.5rem;
              }

              .modal-icon :global(.success-icon) {
                width: 80px;
                height: 80px;
                color: #10b981;
                animation: scaleIn 0.4s ease-out 0.2s both;
              }

              @keyframes scaleIn {
                from {
                  transform: scale(0);
                }
                to {
                  transform: scale(1);
                }
              }

              .modal-title {
                font-family: 'Poppins', sans-serif;
                font-size: 1.875rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 1rem;
                line-height: 1.2;
              }

              .modal-message {
                font-family: 'Poppins', sans-serif;
                font-size: 1rem;
                color: #6b7280;
                line-height: 1.6;
                margin-bottom: 2rem;
              }

              .modal-button {
                width: 100%;
                padding: 0.875rem 1.5rem;
                background: ${BRAND_COLORS.PRIMARY};
                color: white;
                border: none;
                border-radius: 8px;
                font-family: 'Poppins', sans-serif;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(12, 22, 40, 0.2);
              }

              .modal-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(12, 22, 40, 0.3);
                background: #1a2a45;
              }

              .modal-button:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(12, 22, 40, 0.2);
              }

              @media (max-width: 768px) {
                .modal-content {
                  padding: 1.5rem;
                }

                .modal-icon :global(.success-icon) {
                  width: 64px;
                  height: 64px;
                }

                .modal-title {
                  font-size: 1.5rem;
                }

                .modal-message {
                  font-size: 0.9375rem;
                }
              }
            `}</style>
          </div>
        )}
      </>
    )
  }

  // Show skeleton only if we have no data at all (edge case)
  const showSkeleton = isLoading && !initialSetupProgress

  if (showSkeleton) {
    return (
      <div className="profile-completion-reminder skeleton">
        <div className="skeleton-header">
          <div className="skeleton-title"></div>
          <div className="skeleton-progress"></div>
        </div>
        <div className="skeleton-list">
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
        </div>
        <style jsx>{`
          .skeleton {
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
            border-radius: 12px;
            padding: 1.5rem;
            width: 100%;
            max-width: 700px;
            margin: 0;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          .skeleton-header {
            margin-bottom: 1.25rem;
          }

          .skeleton-title {
            height: 20px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 4px;
            width: 70%;
            margin-bottom: 0.75rem;
          }

          .skeleton-progress {
            height: 6px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 999px;
            width: 100%;
          }

          .skeleton-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .skeleton-item {
            height: 18px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 4px;
            width: 85%;
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }

          @media (max-width: 768px) {
            .skeleton {
              max-width: 100% !important;
              margin: 0;
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="profile-completion-reminder">
      <div className="completion-header">
        <h3 className="completion-title">What you'll need to set up your account</h3>
        <div className="completion-progress">
          <span className="completion-text">{completedCount} of {totalCount} completed</span>
          <div className="completion-bar">
            <div
              className="completion-bar-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <ul className="completion-checklist">
        {checklistItems.map((item) => (
          <li key={item.id} className="checklist-item">
            <div className="checklist-icon">
              {item.isCompleted ? (
                <CheckCircleIcon className="icon-completed" />
              ) : (
                <XCircleIcon className="icon-incomplete" />
              )}
            </div>
            <span className={`checklist-label ${item.isCompleted ? 'completed' : ''}`}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Resume Setup Button */}
      <button onClick={handleResumeSetup} className="resume-button">
        <span>Resume account setup</span>
        <ArrowRightIcon className="resume-icon" />
      </button>

      <style jsx>{`
        .profile-completion-reminder {
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 700px;
          margin-top: 1rem;
          box-sizing: border-box;
        }

        .completion-header {
          margin-bottom: 1.25rem;
        }

        .completion-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0;
          line-height: 1.4;
        }

        .completion-progress {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .completion-text {
          font-family: 'Poppins', sans-serif;
          font-size: 0.8125rem;
          color: #6b7280;
          font-weight: 500;
        }

        .completion-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 999px;
          overflow: hidden;
        }

        .completion-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .completion-checklist {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checklist-item {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
        }

        .checklist-icon {
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .checklist-icon :global(.icon-completed) {
          width: 18px;
          height: 18px;
          color: #10b981;
        }

        .checklist-icon :global(.icon-incomplete) {
          width: 18px;
          height: 18px;
          color: #9ca3af;
        }

        .checklist-label {
          font-family: 'Poppins', sans-serif;
          font-size: 0.875rem;
          color: #374151;
          line-height: 1.5;
        }

        .checklist-label.completed {
          color: #6b7280;
          text-decoration: line-through;
        }

        .resume-button {
          width: fit-content;
          margin-top: 1.25rem;
          padding: 0.75rem 1.5rem;
          background: ${BRAND_COLORS.PRIMARY};
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(12, 22, 40, 0.2);
        }

        .resume-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(12, 22, 40, 0.3);
          background: #1a2a45;
        }

        .resume-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(12, 22, 40, 0.2);
        }

        .resume-button :global(.resume-icon) {
          width: 18px;
          height: 18px;
          transition: transform 0.2s ease;
        }

        .resume-button:hover :global(.resume-icon) {
          transform: translateX(4px);
        }

        @media (max-width: 768px) {
          .profile-completion-reminder {
            padding: 1.25rem;
            border-radius: 12px;
            width: 100%;
            max-width: 100% !important;
            margin: 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
            margin-top: 2rem;
          }

          .completion-title {
            font-size: 1rem;
          }

          .checklist-label {
            font-size: 0.8125rem;
          }

          .resume-button {
            padding: 0.625rem 1.25rem;
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  )
}
