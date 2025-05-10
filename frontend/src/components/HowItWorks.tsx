import { Card, CardContent } from "@/components/ui/card";
import Container from "./Layout/Container";
import { UserCircle, Sparkles, Bot } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: UserCircle, title: "Create profile", text: "Swipe 20 vibe cards & write one killer line." },
  { icon: Sparkles,   title: "Sample test", text: "Chat with any celeb-bot of your choice." },
  { icon: Bot,        title: "Meet your AI",     text: "Your persona is live! Chat & Share." },
];

const HowItWorks = () => (
  <section className="bg-zinc-900 py-16 sm:py-20">
    <Container>
      <motion.h2
        className="mb-10 text-center text-2xl font-bold text-white sm:text-3xl"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        How&nbsp;This&nbsp;Works
      </motion.h2>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }) => (
          <motion.div
            key={title}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 250 }}
          >
            <Card
              className="group relative overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-800/40 backdrop-blur
                         before:absolute before:inset-0 before:rounded-2xl
                         before:bg-[radial-gradient(ellipse_at_top,var(--brand-from)_0%,transparent_70%)]
                         before:opacity-0 group-hover:before:opacity-20
                         transition-all duration-300 hover:border-purple-500/70"
            >
              <CardContent className="flex flex-col items-center p-8 sm:p-10">
                <Icon size={36} className="mb-4 text-purple-400 transition-colors group-hover:text-purple-300" />
                <h3 className="mb-1 text-lg font-semibold text-white">{title}</h3>
                <p className="text-center text-xs text-zinc-400 sm:text-sm">{text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Container>
  </section>
);

export default HowItWorks;