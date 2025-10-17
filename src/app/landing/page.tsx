import Footer from "@/components/ui/layout/Footer";
import AboutUs from "./AboutUs";
import FAQ from "./FAQ";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Pricing from "./Pricing";
import Services from "./Services";
import Testimonials from "./Testimonials";


export default function LandingPage() {
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