import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import AboutUs from "@/components/sections/AboutUs";
import Testimonials from "@/components/sections/Testimonials";
import Services from "@/components/sections/Services";
import Pricing from "@/components/sections/Pricing";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/layout/Footer";
// import AustraliaMap from "@/components/sections/AustraliaMap";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <AboutUs />
      <Testimonials />
      <Services />
      {/* <AustraliaMap /> */}
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
