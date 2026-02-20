import DashboardLayout from "@/components/dashboard/DashboardLayout";

/**
 * My Jobs loading skeleton.
 * Next.js App Router shows this file instantly when navigating TO /dashboard/worker/my-jobs
 * while the server is fetching session, profile, and application data.
 * Mirrors the exact structure of MyJobsPage to prevent layout shift.
 */
export default function MyJobsLoading() {
  return (
    <DashboardLayout profileData={{ firstName: "", photo: null, role: "" }}>
      <div style={{ padding: "0 1.5rem 2rem" }}>
        {/* ── Page header skeleton ── */}
        <div className="animate-pulse" style={{ marginBottom: "1.5rem" }}>
          <div style={{ height: "1.5rem", width: "7rem", background: "#e5e7eb", borderRadius: "0.5rem", marginBottom: "0.5rem" }} />
          <div style={{ height: "0.875rem", width: "10rem", background: "#f3f4f6", borderRadius: "0.375rem" }} />
        </div>

        {/* ── Cards grid skeleton — mirrors auto-fill minmax(280px, 1fr) ── */}
        <div
          className="animate-pulse"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
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
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "#dbeafe", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: "0.875rem", background: "#e5e7eb", borderRadius: "0.375rem", marginBottom: "0.4rem", width: "65%" }} />
                  <div style={{ height: "0.75rem", background: "#f3f4f6", borderRadius: "0.375rem", width: "40%" }} />
                </div>
              </div>
              {/* Status badges */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ height: "1.25rem", width: "3.5rem", background: "#dcfce7", borderRadius: "9999px" }} />
                <div style={{ height: "1.25rem", width: "4rem", background: "#fef9c3", borderRadius: "9999px" }} />
              </div>
              {/* Description lines */}
              <div>
                <div style={{ height: "0.75rem", background: "#f3f4f6", borderRadius: "0.375rem", marginBottom: "0.35rem" }} />
                <div style={{ height: "0.75rem", background: "#f3f4f6", borderRadius: "0.375rem", width: "80%", marginBottom: "0.35rem" }} />
                <div style={{ height: "0.75rem", background: "#f3f4f6", borderRadius: "0.375rem", width: "50%" }} />
              </div>
              {/* Applied date + button row */}
              <div style={{ marginTop: "auto" }}>
                <div style={{ height: "0.75rem", width: "8rem", background: "#f3f4f6", borderRadius: "0.375rem", marginBottom: "0.75rem" }} />
                <div style={{ height: "2rem", width: "7rem", background: "#e5e7eb", borderRadius: "0.5rem" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
