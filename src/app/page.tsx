import Hero from "@/components/sections/home/Hero";
import HowItWorks from "@/components/sections/home/HowItWorks";
import AboutUs from "@/components/sections/home/AboutUs";
import Testimonials from "@/components/sections/home/Testimonials";
import Services from "@/components/sections/home/Services";
import Pricing from "@/components/sections/home/Pricing";
import FAQ from "@/components/sections/home/FAQ";
import Footer from "@/components/layout/Footer";
// import AustraliaMap from "@/components/sections/home/AustraliaMap";

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
