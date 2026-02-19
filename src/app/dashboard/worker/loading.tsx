import DashboardLayout from "@/components/dashboard/DashboardLayout";

/**
 * Dashboard loading skeleton.
 * Next.js App Router shows this file instantly when navigating TO /dashboard/worker
 * while the server is fetching session, profile, and job data.
 * Mirrors the exact structure of WorkerDashboard to prevent layout shift.
 */
export default function DashboardLoading() {
  return (
    <DashboardLayout profileData={{ firstName: "", photo: null, role: "" }}>
      {/* ── Hero banner skeleton ── */}
      <div
        className="hero-banner animate-pulse"
        style={{ marginTop: 0 }}
      >
        <div className="hero-content">
          <div style={{ height: "1.75rem", width: "14rem", background: "rgba(255,255,255,0.25)", borderRadius: "0.5rem", marginBottom: "0.75rem" }} />
          <div style={{ height: "1rem", width: "22rem", maxWidth: "100%", background: "rgba(255,255,255,0.18)", borderRadius: "0.5rem", marginBottom: "0.5rem" }} />
          <div style={{ height: "1rem", width: "16rem", maxWidth: "100%", background: "rgba(255,255,255,0.18)", borderRadius: "0.5rem" }} />
        </div>
      </div>

      {/* ── Jobs section skeleton ── */}
      <div style={{ marginTop: "1.5rem" }}>
        {/* Section header row */}
        <div className="animate-pulse" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ height: "1.5rem", width: "11rem", background: "#e5e7eb", borderRadius: "0.5rem" }} />
          <div style={{ height: "2rem", width: "9rem", background: "#f3f4f6", borderRadius: "0.5rem" }} />
          <div style={{ height: "2rem", width: "8rem", background: "#f3f4f6", borderRadius: "0.5rem" }} />
        </div>

        {/* 3 × 2 card grid — matches desktop layout */}
        <div className="course-cards-grid animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #f3f4f6",
                borderRadius: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {/* Title row */}
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "#e5e7eb", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: "0.875rem", background: "#e5e7eb", borderRadius: "0.375rem", marginBottom: "0.4rem", width: "70%" }} />
                  <div style={{ height: "0.75rem", background: "#f3f4f6", borderRadius: "0.375rem", width: "45%" }} />
                </div>
              </div>
              {/* Badge row */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ height: "1.25rem", width: "3.5rem", background: "#dcfce7", borderRadius: "9999px" }} />
                <div style={{ height: "1.25rem", width: "4rem", background: "#f3f4f6", borderRadius: "9999px" }} />
              </div>
              {/* Description lines */}
              <div>
                <div style={{ height: "0.75rem", background: "#f3f4f6", borderRadius: "0.375rem", marginBottom: "0.35rem" }} />
                <div style={{ height: "0.75rem", background: "#f3f4f6", borderRadius: "0.375rem", width: "80%", marginBottom: "0.35rem" }} />
                <div style={{ height: "0.75rem", background: "#f3f4f6", borderRadius: "0.375rem", width: "55%" }} />
              </div>
              {/* Apply button */}
              <div style={{ height: "2.25rem", background: "#e5e7eb", borderRadius: "0.75rem", marginTop: "auto" }} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
