import Link from "next/link";

const links = [
  { label: "Blog", href: "#" },
  { label: "Showcase", href: "#" },
  { label: "Shoutouts", href: "#" },
  { label: "Integrations", href: "#" },
  { label: "Trust", href: "#" },
];

export default function Footer() {
  return (
    <footer className="relative z-20 border-t border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Links Row */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {links.map((link) => (
            <div key={link.label} className="flex items-center">
              <Link
                href={link.href}
                className="text-xs text-white/40 hover:text-white transition-colors uppercase tracking-[0.15em]"
              >
                {link.label}
              </Link>
            </div>
          ))}
        </div>

        {/* Built By */}
        <div className="flex justify-center mb-2">
          <span className="text-[10px] text-white/30 uppercase tracking-[0.15em]">
            Built by{" "}
            <Link
              href="https://github.com/ayan-de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
            >
              Ayan De
            </Link>
          </span>
        </div>

        {/* Independent Project */}
        <div className="flex justify-center">
          <span className="text-[10px] text-white/20 uppercase tracking-[0.15em]">
            Independent project
          </span>
        </div>
      </div>
    </footer>
  );
}
