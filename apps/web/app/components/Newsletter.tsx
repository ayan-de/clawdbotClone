import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 border-t border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tighter uppercase">
          Stay in the Loop
        </h2>
        <p className="text-sm text-white/60 max-w-md mx-auto">
          Get updates on new features, integrations,<br />
          <span className="text-white/40 text-xs">No spam, unsubscribe anytime.</span>
        </p>

        <form onSubmit={handleSubscribe} className="mt-6 max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/30 transition-colors"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/80 transition-all active:scale-95 whitespace-nowrap"
            >
              {isSubscribed ? "Subscribed!" : "Subscribe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
