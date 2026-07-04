import { Nav } from "./components/sections/Nav";
import { Hero } from "./components/sections/Hero";
import { Features } from "./components/sections/Features";
import { HowItWorks } from "./components/sections/HowItWorks";
import { About } from "./components/sections/About";
import { Footer } from "./components/sections/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden="true"
        className="noise-texture pointer-events-none fixed inset-0 z-50 opacity-[0.015]"
      />
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <About />
      </main>
      <Footer />
    </div>
  );
}
