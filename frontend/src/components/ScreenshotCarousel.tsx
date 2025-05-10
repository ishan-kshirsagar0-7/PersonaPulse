import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel";
  import Container from "./Layout/Container";
  import { motion } from "framer-motion";
  
  const screenshots = [
    "/screenshots/chat1.jpg",
    "/screenshots/chat2.jpg",
    "/screenshots/chat3.jpg",
    "/screenshots/chat4.jpg",
  ];
  
  const ScreenshotCarousel = () => (
    <section className="bg-zinc-950 py-12 sm:py-16">
      <Container>
        <motion.h2
          className="mb-6 text-center text-2xl font-bold text-white sm:text-3xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Peek Inside&nbsp;👀
        </motion.h2>
  
        <Carousel className="mx-auto w-full max-w-[90%] sm:max-w-4xl">
          <CarouselContent>
            {screenshots.map((src) => (
              <CarouselItem key={src} className="basis-full">
                <img
                  src={src}
                  alt="Chat screenshot"
                  className="rounded-xl shadow-[0_0_0_1px_rgb(255,255,255,0.05)] transition-transform hover:scale-[1.02]"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Container>
    </section>
  );
  
  export default ScreenshotCarousel;
  