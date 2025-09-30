import Hero from "@/components/sections/landing/Hero";
import HowItWorks from "@/components/sections/landing/HowItWorks";
import AboutUs from "@/components/sections/landing/AboutUs";
import Testimonials from "@/components/sections/landing/Testimonials";
import Services from "@/components/sections/landing/Services";
import SearchSupport from "@/components/sections/landing/SearchSupport";
import Pricing from "@/components/sections/landing/Pricing";
import FAQ from "@/components/sections/landing/FAQ";
import Footer from "@/components/ui/layout/Footer";
// import AustraliaMap from "@/components/sections/landing/AustraliaMap";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <AboutUs />
      <Testimonials />
      <Services />
      {/* <SearchSupport /> */}
      {/* <AustraliaMap /> */}
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
