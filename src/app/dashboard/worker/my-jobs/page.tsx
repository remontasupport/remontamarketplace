import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WithdrawButton from "@/components/dashboard/WithdrawButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyJobsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role !== UserRole.WORKER) redirect("/unauthorized");

  // Fetch worker profile for layout
  const workerProfile = await authPrisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      firstName: true,
      photos: true,
      workerServices: {
        select: { categoryName: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  // Fetch applications with joined job details
  const applications = await authPrisma.jobApplication.findMany({
    where: { workerId: session.user.id },
    include: {
      job: {
        select: {
          id: true,
          recruitmentTitle: true,
          service: true,
          jobDescription: true,
          city: true,
          state: true,
          postedAt: true,
          active: true,
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  const primaryService =
    workerProfile?.workerServices?.[0]?.categoryName || "Support Worker";

  return (
    <DashboardLayout
      profileData={{
        firstName: workerProfile?.firstName || "Worker",
        photo: workerProfile?.photos || null,
        role: primaryService,
      }}
    >
      <div style={{ padding: "0 1.5rem 2rem" }}>
        {/* Page header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "0.25rem",
            }}
          >
            My Jobs
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {applications.length === 0
              ? "You haven't applied for any jobs yet."
              : `${applications.length} job${applications.length !== 1 ? "s" : ""} applied`}
          </p>
        </div>

        {/* Empty state */}
        {applications.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem 1rem",
              background: "#f9fafb",
              borderRadius: "1rem",
              border: "1px dashed #e5e7eb",
              textAlign: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "50%",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#9ca3af"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "0.25rem",
                }}
              >
                No applications yet
              </p>
              <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                Browse available jobs on the dashboard and hit Apply Now.
              </p>
            </div>
            <Link
              href="/dashboard/worker"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.625rem 1.25rem",
                background: "#111827",
                color: "#fff",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Browse Jobs
            </Link>
          </div>
        )}

        {/* Applications grid */}
        {applications.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {applications.map(({ id, appliedAt, job, status }) => {
              const title =
                job.recruitmentTitle ||
                [
                  job.service,
                  [job.city, job.state].filter(Boolean).join(", "),
                ]
                  .filter(Boolean)
                  .join(" - ") ||
                "Support Work";

              const location =
                [job.city, job.state].filter(Boolean).join(", ") || "Remote";

              const appliedDate = new Date(appliedAt).toLocaleDateString(
                "en-AU",
                { day: "numeric", month: "short", year: "numeric" }
              );

              return (
                <div
                  key={id}
                  style={{
                    background: "#fff",
                    borderRadius: "1rem",
                    border: "1px solid #f3f4f6",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    opacity: status === "WITHDRAWN" || !job.active ? 0.6 : 1,
                  }}
                >
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "50%",
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="#2563eb"
                      >
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          color: "#111827",
                          lineHeight: 1.3,
                          marginBottom: "0.2rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {title}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.2rem",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        {location}
                      </p>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    {/* Job active/closed */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        padding: "0.2rem 0.65rem",
                        borderRadius: "9999px",
                        background: job.active ? "#dcfce7" : "#f3f4f6",
                        color: job.active ? "#15803d" : "#6b7280",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: job.active ? "#16a34a" : "#9ca3af",
                          display: "inline-block",
                        }}
                      />
                      {job.active ? "Active" : "Closed"}
                    </span>

                    {/* Application status */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        padding: "0.2rem 0.65rem",
                        borderRadius: "9999px",
                        background: status === "WITHDRAWN" ? "#fee2e2" : "#fef9c3",
                        color: status === "WITHDRAWN" ? "#991b1b" : "#854d0e",
                      }}
                    >
                      {status === "WITHDRAWN" ? "Withdrawn" : "Applied"}
                    </span>
                  </div>

                  {/* Job description */}
                  {job.jobDescription && (
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#6b7280",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {job.jobDescription}
                    </p>
                  )}

                  {/* Applied date + Withdraw */}
                  <div style={{ marginTop: "auto" }}>
                    <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      Applied on {appliedDate}
                    </p>
                    {status === "PENDING" && <WithdrawButton jobId={job.id} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
