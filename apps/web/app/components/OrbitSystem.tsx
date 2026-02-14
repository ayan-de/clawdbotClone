import { FaGoogleDrive, FaSlack, FaGithub, FaJira, FaMicrosoft } from "react-icons/fa";
import { SiGmail, SiNotion, SiLinear } from "react-icons/si";

export default function OrbitSystem() {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0 opacity-40">
      {/* Central Gravity Well */}
      <div className="relative flex items-center justify-center">
        {/* Core */}
        <div className="absolute w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center bg-black">
          <span className="font-bold text-xs tracking-tighter text-white">ORBIT</span>
        </div>

        {/* Orbit Ring 1 */}
        <div className="absolute w-[300px] h-[300px] border border-white/20 rounded-full animate-[spin_20s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black p-2 rounded-full border border-white/20">
             <SiGmail className="w-4 h-4 text-[#EA4335]" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-black p-2 rounded-full border border-white/20">
             <FaSlack className="w-4 h-4 text-[#4A154B]" />
          </div>
        </div>

        {/* Orbit Ring 2 */}
        <div className="absolute w-[450px] h-[450px] border border-dashed border-white/20 rounded-full animate-[spin_35s_linear_infinite_reverse]">
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-black p-2 rounded-full border border-white/20">
             <FaMicrosoft className="w-4 h-4 text-[#00A4EF]" />
          </div>
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black p-2 rounded-full border border-white/20">
             <FaGithub className="w-4 h-4 text-white" />
          </div>
          <div className="absolute bottom-[15%] right-[15%] bg-black p-2 rounded-full border border-white/20">
             <SiNotion className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Orbit Ring 3 */}
        <div className="absolute w-[600px] h-[600px] border border-white/10 rounded-full animate-[spin_50s_linear_infinite]">
           <div className="absolute top-[20%] left-[20%] bg-black p-2 rounded-full border border-white/20">
             <FaGoogleDrive className="w-4 h-4 text-[#1FA463]" />
          </div>
          <div className="absolute bottom-[30%] right-[10%] bg-black p-2 rounded-full border border-white/20">
             <SiLinear className="w-4 h-4 text-[#5E6AD2]" />
          </div>
          <div className="absolute top-[50%] right-[-10px] bg-black p-2 rounded-full border border-white/20">
             <FaJira className="w-4 h-4 text-[#0052CC]" />
          </div>
        </div>
        
      </div>
    </div>
  );
}
