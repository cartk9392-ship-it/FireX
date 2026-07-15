import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { 
  Trophy, Wallet, Flame, ChevronDown, HelpCircle, Gamepad2, Play
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  gameMode: string;
  entryFee: number;
  prizePool: number;
  map: string;
  date: string;
  time: string;
  maxSlots: number;
  joinedCount: number;
  status: string;
}

export const Landing: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/tournaments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTournaments(data.slice(0, 3)); // show top 3
        }
      })
      .catch(err => console.error("Error fetching tournaments:", err))
      .finally(() => setLoading(false));
  }, []);

  const faqs = [
    {
      q: "How do I register and join a tournament?",
      a: "First, click the Register button to create a player profile. Once registered, log in to your Player Dashboard, deposit funds into your simulator wallet, and select 'Join Tournament' from the sidebar to register for any open tournament."
    },
    {
      q: "What is the entry fee structure?",
      a: "Each tournament lists its specific Entry Fee (in INR) and total Prize Pool. The entry fee is automatically deducted from your FireX wallet balance when you click join."
    },
    {
      q: "How are rooms IDs and passwords shared?",
      a: "Once an admin creates a Match room, the Room ID and Password will instantly be populated on your Player Dashboard and notifications area 15-30 minutes before the match start time."
    },
    {
      q: "How is the prize pool distributed?",
      a: "Immediately following match completion, the admin uploads the final leaderboard (rankings and kills). The system automatically computes and credits your wallet balance in real-time."
    }
  ];

  return (
    <div className="bg-background text-textWhite min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Graphic elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-6 text-xs font-bold text-primary tracking-wider uppercase animate-pulse">
            <Flame size={12} />
            The Ultimate Free Fire Tournament ERP
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight uppercase leading-none mb-6">
            Manage & Conquer <br />
            <span className="text-primary text-glow-orange">Tournaments</span> Like a Pro
          </h1>

          <p className="max-w-2xl mx-auto text-textGray text-base sm:text-lg mb-10 font-medium">
            FireX is an enterprise-grade ERP system built to run, automate, and participate in competitive Free Fire tournaments. Complete with real-time wallets, matches, automatic results, and detailed statistics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" icon={<Play size={16} fill="white" />}>
                Register & Play
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Player Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Bar */}
      <section className="py-10 border-y border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-primary">100+</h3>
              <p className="text-xs uppercase font-bold text-textGray tracking-wider mt-1">Tournaments Hosted</p>
            </div>
            <div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white">5,000+</h3>
              <p className="text-xs uppercase font-bold text-textGray tracking-wider mt-1">Active Players</p>
            </div>
            <div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white">10k+</h3>
              <p className="text-xs uppercase font-bold text-textGray tracking-wider mt-1">Kills Logged</p>
            </div>
            <div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-primary">₹500K+</h3>
              <p className="text-xs uppercase font-bold text-textGray tracking-wider mt-1">Prize Pools Distributed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section id="tournaments" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight">
              Featured <span className="text-primary text-glow-orange">Tournaments</span>
            </h2>
            <p className="text-textGray text-sm mt-2 max-w-lg">
              Join live battles, test your squad's survival skills, and take home massive cash prizes.
            </p>
          </div>
          <Link to="/login" className="mt-4 md:mt-0 text-sm font-bold text-primary hover:text-orange-400 transition">
            View All Tournaments →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center p-12 bg-cardBg border border-slate-850 rounded-xl max-w-md mx-auto">
            <Trophy size={48} className="text-orange-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Tournaments Listed</h3>
            <p className="text-xs text-textGray mb-4">There are currently no active or upcoming battles listed. Create a tournament in the Admin Dashboard to test.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tournaments.map((t) => (
              <Card key={t.id} hoverGlow className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Badge>{t.status}</Badge>
                    <span className="text-xs text-textGray font-bold uppercase">{t.gameMode}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t.name}</h3>
                  <p className="text-xs text-textGray mb-5">Map: {t.map} | Start: {t.date} {t.time}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-900/60 rounded-lg border border-slate-800">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-textGray tracking-wider">Prize Pool</span>
                      <span className="text-base font-extrabold text-primary">₹{t.prizePool}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-textGray tracking-wider">Entry Fee</span>
                      <span className="text-base font-extrabold text-white">₹{t.entryFee}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-auto">
                  <span className="text-xs text-textGray font-semibold">
                    Slots: {t.joinedCount}/{t.maxSlots} Joined
                  </span>
                  <Link to="/login">
                    <Button size="sm">Register Now</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-slate-800/60 bg-slate-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase">
              Robust <span className="text-primary text-glow-orange">ERP Features</span>
            </h2>
            <p className="text-textGray max-w-lg mx-auto text-sm mt-3">
              We provide enterprise-level tools for organizing tournaments without manual friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center mx-auto mb-6">
                <Wallet size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Simulated Wallet</h3>
              <p className="text-xs text-textGray leading-relaxed">
                Add mock funds to play. Real-time withdrawal approval flow for secure payouts.
              </p>
            </Card>

            <Card className="text-center p-8">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center mx-auto mb-6">
                <Gamepad2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Match Room Allocation</h3>
              <p className="text-xs text-textGray leading-relaxed">
                Room IDs and passwords distributed instantly to registered players in-dashboard.
              </p>
            </Card>

            <Card className="text-center p-8">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center mx-auto mb-6">
                <Trophy size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Automatic Leaderboards</h3>
              <p className="text-xs text-textGray leading-relaxed">
                Submit scores, kills, and ranks. System credits winners' wallets automatically.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <h2 className="text-3xl font-extrabold uppercase text-center mb-12">
          Frequently Asked <span className="text-primary text-glow-orange">Questions</span>
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-cardBg border border-slate-800 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setFaqOpen(faqOpen === index ? null : index)}
            >
              <div className="flex items-center justify-between p-5 text-sm font-bold text-white">
                <div className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-primary shrink-0" />
                  <span>{faq.q}</span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-textGray transition-transform duration-200 ${faqOpen === index ? 'rotate-180 text-primary' : ''}`} 
                />
              </div>
              {faqOpen === index && (
                <div className="px-5 pb-5 pt-1 text-xs text-textGray leading-relaxed border-t border-slate-800/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-center text-textGray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between flex-wrap gap-6 items-center border-b border-slate-800 pb-8 mb-8 text-left">
            <div>
              <span className="text-lg font-black uppercase tracking-tight text-white">
                Fire<span className="text-primary">X</span>
              </span>
              <p className="text-xs text-textGray mt-1.5 max-w-sm">
                Enterprise gaming ERP system for managing, scoring, and playing Garena Free Fire brackets.
              </p>
            </div>
            <div className="flex gap-8 text-xs font-bold uppercase tracking-wider">
              <Link to="/login" className="hover:text-white transition">Player Login</Link>
              <Link to="/admin/login" className="hover:text-white transition text-red-400">Admin Portal</Link>
              <a href="#faq" className="hover:text-white transition">Support</a>
            </div>
          </div>
          <p className="text-[11px] text-slate-600">
            © 2026 FireX ERP. All rights reserved. This site is simulated and is not affiliated with Garena Free Fire.
          </p>
        </div>
      </footer>
    </div>
  );
};
export default Landing;
