import ProjectInput from "@/components/ProjectInput";
import { Terminal, TypingAnimation, AnimatedSpan } from "@/components/ui/terminal";
import { Meteors } from "@/components/ui/meteors"

export default function Home() {
  const installCommands = `git clone https://github.com/Riteshgupta2906/code-visualizer.git
cd code-visualizer
npm install
npm run dev`;

  return (
    <main className="min-h-screen bg-black relative overflow-hidden selection:bg-blue-500/30">
      {/* Meteors Layer - positioned absolutely to cover the hero section */}
      <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-20">
        <Meteors />
      </div>

      {/* Ambient Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-900/20 blur-[120px] -z-10 rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-4xl mx-auto space-y-6 relative z-0">
          <div className="inline-flex items-center justify-center p-2 mb-4 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm shadow-xl">
             <div className="flex items-center gap-2 px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-gray-400">v0.0.9 is live</span>
             </div>
          </div>

          <h1 className="text-7xl md:text-8xl font-bold tracking-tight text-white mb-6">
            Code <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Eye</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            Visualize your Next.js application architecture instantly. <br/>
            <span className="text-gray-500">No configuration required.</span>
          </p>
        </div>

        {/* Terminal with Back Glow */}
        <div className="w-full max-w-2xl mx-auto mb-10 relative group z-30">
          {/* Main Glow Effect - Uniform Rectangular Glow */}
          <div className="absolute -inset-10 bg-blue-600/40 blur-[60px] rounded-3xl opacity-80 pointer-events-none"></div>
          
          <div className="relative flex justify-center">
             <Terminal 
               className="w-full max-w-2xl shadow-2xl bg-black/95 border-gray-800 backdrop-blur-xl rounded-xl"
               copyCommand={installCommands}
             >
              <TypingAnimation duration={20} delay={500} className="text-gray-100 font-mono">$ git clone https://github.com/Riteshgupta2906/code-visualizer.git</TypingAnimation>
              
              <AnimatedSpan delay={1500} className="text-gray-400 font-mono">Cloning into 'code-visualizer'...</AnimatedSpan>
              <AnimatedSpan delay={1600} className="text-gray-400 font-mono">remote: Enumerating objects: 155, done.</AnimatedSpan>
              <AnimatedSpan delay={1700} className="text-gray-400 font-mono">remote: Counting objects: 100% (155/155), done.</AnimatedSpan>
              <AnimatedSpan delay={1800} className="text-gray-400 font-mono">remote: Compressing objects: 100% (113/113), done.</AnimatedSpan>
              <AnimatedSpan delay={1900} className="text-gray-400 font-mono">remote: Total 155 (delta 44), reused 143 (delta 32), pack-reused 0 (from 0)</AnimatedSpan>
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
        
        <footer className="mt-32 text-gray-600 text-sm">
           <p>Open Source • Powered by Babel AST • Local First</p>
        </footer>
      </div>
    </main>
  );
}