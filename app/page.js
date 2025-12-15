import ProjectInput from "@/components/ProjectInput";
import { Terminal, TypingAnimation, AnimatedSpan } from "@/components/ui/terminal";
import { Meteors } from "@/components/ui/meteors";
import { Particles } from "@/components/ui/particles";
import BlackHole from "@/components/blackhole";

export default function Home() {
  const installCommands = `git clone https://github.com/Riteshgupta2906/code-visualizer.git
cd code-visualizer
npm install
npm run dev`;

  return (
    <main className="min-h-screen relative overflow-x-hidden selection:bg-purple-500/30" style={{ backgroundColor: 'rgb(2,0,21)' }}>
      {/* Meteors Layer - positioned absolutely to cover the hero section */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-20">
        <Meteors />
      </div>

      <Particles
        className="absolute inset-0 z-0"
        quantity={100}
        ease={80}
        color="#ffffff"
        refresh
      />

      {/* Black Hole Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-10 flex justify-center -translate-y-14">
        <div className="w-full h-full relative">
            <BlackHole 
            videoSrc="black-hole.webm" 
            className="w-full h-full"
            />
        </div>
      </div>

      {/* Ambient Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-900/20 blur-[120px] -z-10 rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 py-8 pb-24 relative z-30 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-8 max-w-4xl mx-auto space-y-6 relative z-0">
          

          <h1 className="text-7xl md:text-8xl font-bold tracking-tight text-white mb-6">
            Code <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-800">Eye</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
            Transform your Next.js App Router and Prisma schemas into interactive dependency graphs.
          </p>
        </div>

        {/* Terminal with Back Glow */}
        <div className="w-full max-w-3xl mx-auto mt-38 mb-10 relative group z-40">
          {/* Main Glow Effect - Uniform Rectangular Glow */}
          {/* <div className="absolute -inset-10 bg-purple-600/40 blur-[60px] rounded-3xl opacity-80 pointer-events-none"></div>
           */}
          <div className="relative flex justify-center">
             <Terminal 
               className="w-full max-w-3xl shadow-2xl bg-black/30 border-white/10 backdrop-blur-xl rounded-xl"
               copyCommand={installCommands}
             >
              <TypingAnimation duration={20} delay={500} className="text-gray-100 font-mono">$ git clone https://github.com/Riteshgupta2906/code-visualizer.git</TypingAnimation>
              
              <AnimatedSpan delay={1500} className="text-gray-400 font-mono">{`Cloning into 'code-visualizer'...`}</AnimatedSpan>
              <AnimatedSpan delay={1600} className="text-gray-400 font-mono">remote: Enumerating objects: 155, done.</AnimatedSpan>
              <AnimatedSpan delay={1700} className="text-gray-400 font-mono">remote: Counting objects: 100% (155/155), done.</AnimatedSpan>
              <AnimatedSpan delay={2000} className="text-gray-400 font-mono">Receiving objects: 100% (155/155), 211.40 KiB | 2.30 MiB/s, done.</AnimatedSpan>
              <AnimatedSpan delay={2100} className="text-gray-400 font-mono">Resolving deltas: 100% (44/44), done.</AnimatedSpan>
              
              <TypingAnimation duration={20} delay={2500} className="text-gray-100 font-mono">$ cd code-visualizer</TypingAnimation>
              
              <TypingAnimation duration={20} delay={3200} className="text-gray-100 font-mono">code-visualizer $ npm install</TypingAnimation>
              <AnimatedSpan delay={4200} className="text-green-400 font-mono">✓ added 842 packages in 4s</AnimatedSpan>
              
              <TypingAnimation duration={20} delay={4700} className="text-gray-100 font-mono">code-visualizer $ npm run dev</TypingAnimation>
              <AnimatedSpan delay={5500} className="text-green-400 font-mono">ready - started server on 0.0.0.0:3000, url: http://localhost:3000</AnimatedSpan>
            </Terminal>
          </div>
        </div>

        {/* Project Input Section */}
        <div className="w-full max-w-4xl">
          <ProjectInput />
        </div>
        
     
      </div>
    </main>
  );
}