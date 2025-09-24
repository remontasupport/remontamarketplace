import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import AboutUs from "@/components/sections/AboutUs";
import CTA from "@/components/sections/CTA";
import Testimonials from "@/components/sections/Testimonials";
import Services from "@/components/sections/Services";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <AboutUs />
      <CTA />
      <Testimonials />
      <Services />
    </div>
  );
}
