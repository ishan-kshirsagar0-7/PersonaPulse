import Container from "./Layout/Container";
import reactLogo from "@/assets/react.png";
import viteLogo from "@/assets/vite.png";
import tailwindLogo from "@/assets/tailwind.png";
import shadcnLogo from "@/assets/shadcn.png";
import supabaseLogo from "@/assets/supabase.png";
import geminiLogo from "@/assets/gemini.png";
import pythonLogo from "@/assets/python.png";
import fastapiLogo from "@/assets/fastapi.png";

const tech = [
  { label: "React",       logo: reactLogo },
  { label: "Vite",        logo: viteLogo },
  { label: "Tailwind",    logo: tailwindLogo },
  { label: "shadcn/ui",   logo: shadcnLogo },
  { label: "Supabase",    logo: supabaseLogo },
  { label: "Gemini AI",   logo: geminiLogo },
  { label: "Python",   logo: pythonLogo },
  { label: "FastAPI",   logo: fastapiLogo },
];

export default function FooterTech() {
  return (
    <footer className="bg-black pb-12 pt-16">
      <Container className="flex flex-wrap justify-center gap-4">
        {tech.map(({ label, logo }) => (
          <span
            key={label}
            className="flex items-center gap-2 rounded-full bg-zinc-800/60 px-5 py-2.5 text-sm font-medium tracking-wide text-zinc-300 backdrop-blur transition-colors hover:bg-purple-600/40 hover:text-white"
          >
            <img
              src={logo}
              alt={`${label} logo`}
              className="h-5 w-5 object-contain"
            />
            {label}
          </span>
        ))}
      </Container>

      <Container className="mt-10 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} PersonaPulse — crafted by Ishan Kshirsagar.
      </Container>
    </footer>
  );
}