import SimpleHeader from "@/components/ui/layout/SimpleHeader";

export default function RegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* <SimpleHeader /> */}
      {children}
    </div>
  );
}