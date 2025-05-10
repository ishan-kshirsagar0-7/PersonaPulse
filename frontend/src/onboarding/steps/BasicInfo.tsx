import { useState, useEffect } from "react";
import Select, { MultiValue, SingleValue, StylesConfig } from "react-select";
import CreatableSelect from "react-select/creatable";
import makeAnimated from "react-select/animated";
import { Button } from "@/components/ui/button";
import useCountryOptions from "@/hooks/useCountryOptions";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

const animated = makeAnimated();
type Option = { label: string; value: string };

const darkStyles: StylesConfig<Option, boolean> = {
  control: (styles) => ({
    ...styles,
    backgroundColor: '#27272a',
    border: '1px solid #52525b',
    boxShadow: 'none',
    ':hover': { borderColor: '#a855f7' },
  }),
  singleValue: (styles) => ({ ...styles, color: 'white' }),
  multiValue: (styles) => ({ ...styles, backgroundColor: '#3f3f46' }),
  multiValueLabel: (styles) => ({ ...styles, color: 'white' }),
  input: (styles) => ({ ...styles, color: 'white' }),
  placeholder: (styles) => ({ ...styles, color: '#a1a1aa' }),
  menu: (styles) => ({ ...styles, backgroundColor: '#18181b', color: 'white' }),
  option: (styles, { isFocused, isSelected }) => ({
    ...styles,
    backgroundColor: isSelected ? '#581c87' : isFocused ? '#3f3f46' : '#18181b',
    color: 'white',
    cursor: 'pointer',
    ':active': {
        backgroundColor: '#4c1d95',
    },
  }),
};

interface Props {
  onNext: () => void;
}

export default function BasicInfo({ onNext }: Props) {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState<SingleValue<Option>>(null);
  const [langs, setLangs] = useState<MultiValue<Option>>([]);
  const [occ, setOcc] = useState<SingleValue<Option>>(null);
  const [pfpUrlToSave, setPfpUrlToSave] = useState<string | undefined>(undefined);


  useEffect(() => {
    if (session?.user?.user_metadata) {
      const meta = session.user.user_metadata;
      setPfpUrlToSave(meta.avatar_url || meta.picture);
    }
  }, [session]);


  const countries = useCountryOptions();
  const languageOps = ["English", "Spanish", "Hindi", "Marathi", "French", "German", "Japanese",
    "Mandarin", "Portuguese", "Russian", "Arabic", "Korean", "Italian",
    "Turkish", "Dutch", "Swedish", "Polish", "Bengali", "Tamil",
    "Gujarati", "Urdu", "Hebrew", "Persian", "Vietnamese", "Thai",
    "Indonesian", "Malay", "Greek", "Czech", "Romanian", "Finnish",
    "Norwegian", "Danish", "Hungarian", "Ukrainian", "Slovak", "Bulgarian",
    "Croatian", "Serbian", "Slovenian", "Lithuanian", "Latvian", "Estonian",
    "Icelandic", "Irish", "Welsh", "Scottish Gaelic", "Basque", "Catalan"]
    .map(l => ({ label: l, value: l }));

  const occOps = ["Software Engineer", "Designer", "Product Manager", "Student",
    "Data Scientist", "Entrepreneur", "Doctor", "Teacher", "Lawyer",
    "Researcher", "Content Creator", "Marketing Specialist",
    "Sales Manager", "Consultant", "Architect", "Engineer",
    "Financial Analyst", "Mechanic", "Artist", "Writer",
    "Photographer", "Videographer", "Chef", "Musician",
    "Actor", "Athlete", "Journalist", "Professor", "HR Manager",
    "Game Developer", "AI/ML Engineer", "Business Analyst", "Web Developer",
    "Network Administrator", "Cybersecurity Specialist", "Cloud Engineer", "Plumber",
    "Electrician", "Carpenter", "Welder", "Construction Worker"]
    .map(o => ({ label: o, value: o }));

  const next = async () => {
    if (!session?.user.id) {
      console.error("No session user ID found. Cannot save basic info.");
      return;
    }

    const { error } = await supabase
      .from('persona_profiles')
      .upsert({
        user_id: session.user.id,
        name,
        dob: dob || null,
        country: country?.value,
        languages: langs.map(l => l.value),
        occupation: occ?.value,
        pfp_url: pfpUrlToSave,
      }, { 
        onConflict: 'user_id', 
      });

    if (error) {
      console.error("❌ Failed to save basic info:", error);
    } else {
      console.log("✅ Basic info (including PFP URL) saved!");
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-center text-xl font-semibold">Basic information</h2>

      <input
        placeholder="Preferred name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md bg-zinc-800/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 border border-zinc-700"
      />

      <input
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        className="w-full rounded-md bg-zinc-800/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 border border-zinc-700 text-zinc-400"
        style={{ colorScheme: 'dark' }}
      />

      <Select<Option, false>
        instanceId="country-select"
        options={countries}
        value={country}
        onChange={(v) => setCountry(v)}
        placeholder="Country"
        components={animated}
        styles={darkStyles}
      />

      <Select<Option, true>
        isMulti
        instanceId="language-select"
        options={languageOps}
        value={langs}
        onChange={(v) => setLangs(v)}
        placeholder="Primary language(s)"
        components={animated}
        styles={darkStyles}
      />

      <CreatableSelect<Option, false>
        instanceId="occupation-select" 
        options={occOps}
        value={occ}
        onChange={(v) => setOcc(v)}
        placeholder="Occupation / field (type to create)"
        components={animated}
        styles={darkStyles}
        formatCreateLabel={(inputValue) => `Add "${inputValue}"`} 
      />

      <Button
        variant="brandBlue"
        className="mx-auto mt-4 w-40 block" 
        disabled={!name || !country }
        onClick={next}
      >
        Next →
      </Button>
    </div>
  );
}