import { FaGoogleDrive, FaSlack, FaGithub, FaJira, FaMicrosoft } from "react-icons/fa";
import { SiGmail, SiNotion, SiLinear } from "react-icons/si";

interface Planet {
  icon: React.ReactNode;
  color: string;
  name: string;
  orbitSpeed: number;
  orbitDelay: string;
  orbitSize: number;
  orbitReverse?: boolean;
}

const planets: Planet[] = [
  { icon: <SiGmail className="w-4 h-4" />, color: "#EA4335", name: "Gmail", orbitSpeed: 20, orbitDelay: "0s", orbitSize: 300 },
  { icon: <FaSlack className="w-4 h-4" />, color: "#4A154B", name: "Slack", orbitSpeed: 20, orbitDelay: "10s", orbitSize: 300 },
  { icon: <FaMicrosoft className="w-4 h-4" />, color: "#00A4EF", name: "Teams", orbitSpeed: 35, orbitDelay: "-5s", orbitSize: 450, orbitReverse: true },
  { icon: <FaGithub className="w-4 h-4" />, color: "#ffffff", name: "GitHub", orbitSpeed: 35, orbitDelay: "-15s", orbitSize: 450 },
  {
    icon: <img src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/notion.webp" alt="Notion" className="w-4 h-4" />,
    color: "#000000",
    name: "Notion",
    orbitSpeed: 35,
    orbitDelay: "-25s",
    orbitSize: 450
  },
  { icon: <FaGoogleDrive className="w-4 h-4" />, color: "#1FA463", name: "Drive", orbitSpeed: 50, orbitDelay: "-10s", orbitSize: 600 },
  { icon: <SiLinear className="w-4 h-4" />, color: "#5E6AD2", name: "Linear", orbitSpeed: 50, orbitDelay: "-30s", orbitSize: 600 },
  { icon: <FaJira className="w-4 h-4" />, color: "#0052CC", name: "Jira", orbitSpeed: 50, orbitDelay: "-50s", orbitSize: 600 },
];

export default function OrbitSystem() {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-10">
      {/* Ambient Glow from Central Core */}
      <div className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />

      {/* Galaxy Spiral - using inline styles for the gradient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vh] h-[120vh] pointer-events-none opacity-15"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 20%, rgba(255, 255, 255, 0.03) 21%, transparent 22%),
            radial-gradient(ellipse at center, transparent 30%, rgba(99, 102, 241, 0.04) 31%, transparent 32%),
            radial-gradient(ellipse at center, transparent 40%, rgba(168, 85, 247, 0.03) 41%, transparent 42%),
            radial-gradient(ellipse at center, transparent 50%, rgba(59, 130, 246, 0.03) 51%, transparent 52%)
          `,
          animation: 'galaxyRotate 120s linear infinite',
        }}
      />

      {/* Central Gravity Well */}
      <div className="relative flex items-center justify-center">
        {/* Core Glow */}
        <div className="absolute w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse" />

        {/* Core with pulsing border */}
        <div className="relative w-20 h-20">
          {/* Pulsing rings */}
          <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute inset-2 border border-white/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_1.5s_infinite]" />

          {/* Main core */}
          <div className="absolute inset-0 bg-black border-2 border-white/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(147,197,253,0.3),0_0_80px_rgba(168,85,247,0.2)]">
            <span className="font-bold text-xs tracking-tighter text-white space-glow">ORBIT</span>
          </div>

          {/* Inner glow */}
          <div className="absolute inset-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-md" />
        </div>

        {/* Orbit Ring 1 - Circular */}
        <div className="absolute w-[300px] h-[300px] border border-white/15 rounded-full">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              animation: `spin 20s linear infinite`,
              willChange: 'transform',
            }}
          >
            {planets.slice(0, 2).map((planet, index) => (
              <div
                key={planet.name}
                className="absolute bg-black p-2 rounded-full border border-white/20 transition-transform hover:scale-110"
                style={{
                  top: index === 0 ? '0' : 'auto',
                  bottom: index === 1 ? '0' : 'auto',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  boxShadow: `0 0 10px ${planet.color}40, 0 0 20px ${planet.color}20`,
                  animationDelay: planet.orbitDelay,
                }}
              >
                <div
                  className="planet-glow"
                  style={{
                    color: planet.color,
                  }}
                >
                  {planet.icon}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orbit Ring 2 - Elliptical */}
        <div
          className="absolute border-dashed border-white/10 rounded-full"
          style={{
            width: '500px',
            height: '400px',
            animation: `spin 35s linear infinite reverse`,
            willChange: 'transform',
          }}
        >
          {planets.slice(2, 5).map((planet, index) => (
            <div
              key={planet.name}
              className="absolute bg-black p-2 rounded-full border border-white/20 transition-transform hover:scale-110"
              style={{
                right: index === 0 ? '0' : undefined,
                left: index === 1 ? '0' : (index === 2 ? '50%' : undefined),
                top: index === 0 || index === 1 ? '50%' : 'auto',
                bottom: index === 2 ? '0' : undefined,
                transform: index === 2 ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',
                boxShadow: `0 0 10px ${planet.color}40, 0 0 20px ${planet.color}20`,
              }}
            >
              <div
                className="planet-glow"
                style={{
                  color: planet.color,
                }}
              >
                {planet.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Orbit Ring 3 - Elliptical Large */}
        <div
          className="absolute border border-white/5 rounded-full"
          style={{
            width: '700px',
            height: '550px',
            animation: `spin 50s linear infinite`,
            willChange: 'transform',
          }}
        >
          {planets.slice(5, 8).map((planet, index) => (
            <div
              key={planet.name}
              className="absolute bg-black p-2 rounded-full border border-white/20 transition-transform hover:scale-110"
              style={{
                right: index === 0 ? '0' : undefined,
                left: index === 1 ? '0' : (index === 2 ? '50%' : undefined),
                top: index === 0 || index === 1 ? '50%' : 'auto',
                bottom: index === 2 ? '0' : undefined,
                transform: index === 2 ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',
                boxShadow: `0 0 10px ${planet.color}40, 0 0 20px ${planet.color}20`,
              }}
            >
              <div
                className="planet-glow"
                style={{
                  color: planet.color,
                }}
              >
                {planet.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Orbital Paths (subtle visible paths) */}
        <div className="absolute w-[300px] h-[300px] border border-white/5 rounded-full opacity-30" />
        <div
          className="absolute border border-white/5 rounded-full opacity-20"
          style={{
            width: '500px',
            height: '400px',
          }}
        />
        <div
          className="absolute border border-white/5 rounded-full opacity-15"
          style={{
            width: '700px',
            height: '550px',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes galaxyRotate {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
