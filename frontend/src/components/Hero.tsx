import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Container from "./Layout/Container";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-black to-zinc-900">
      <Container className="relative flex min-h-[80vh] flex-col items-center justify-center text-center">
        {/* headline */}
        <motion.h1
          className="mb-10 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent leading-tight sm:text-5xl md:mb-12 md:text-6xl md:leading-[1.12] lg:text-7xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Turn&nbsp;your&nbsp;vibe&nbsp;into&nbsp;an&nbsp;AI&nbsp;assistant.
        </motion.h1>

        {/* subtitle */}
        <motion.p
          className="mb-14 max-w-[22rem] text-sm text-zinc-400 sm:max-w-md sm:text-base md:mb-16 md:max-w-xl md:text-lg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        >
          Clone yourself digitally in&nbsp;
          <span className="font-semibold text-white">5&nbsp;minutes</span>
          — zero code, zero hassle.
        </motion.p>

        {/* CTA */}
        <motion.div whileTap={{ scale: 0.94 }}>
          <Button
            variant="brandBlue"
            size="lg"
            onClick={() => navigate("/login")}
          >
            Get&nbsp;Started&nbsp;→
          </Button>
        </motion.div>

        {/* animated orb & sparkles */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
          aria-hidden
        >
          <div className="animate-hero-orb-smooth h-[720px] w-[720px] rounded-full blur-3xl" />
        </div>

        <div
          className="pointer-events-none absolute -top-32 -left-32 -z-20 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,var(--brand-to)_0%,transparent_70%)] opacity-25 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 -z-20 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-[radial-gradient(circle_at_center,var(--brand-from)_0%,transparent_70%)] opacity-20 blur-2xl"
          aria-hidden
        />

        {[...Array(25)].map((_, i) => (
          <span
            key={i}
            className="pointer-events-none absolute -z-10 block h-0.5 w-0.5 rounded-full bg-white/80 opacity-0 animate-[pulse_4s_infinite]"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
            }}
            aria-hidden
          />
        ))}
      </Container>
    </section>
  );
};

export default Hero;