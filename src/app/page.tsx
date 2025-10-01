import Hero from "@/app/pages/landing/Hero";
import HowItWorks from "@/app/pages/landing/HowItWorks";
import AboutUs from "@/app/pages/landing/AboutUs";
import Testimonials from "@/app/pages/landing/Testimonials";
import Services from "@/app/pages/landing/Services";
import SearchSupport from "@/app/pages/landing/SearchSupport";
import Pricing from "@/app/pages/landing/Pricing";
import FAQ from "@/app/pages/landing/FAQ";
import Footer from "@/components/ui/layout/Footer";
// import AustraliaMap from "@/components/sections/landing/AustraliaMap";

import LandingPage from "./pages/landing/page";

export default function Home() {
  return (
    <div className="min-h-screen">
     <LandingPage/>
    </div>
  );
}
