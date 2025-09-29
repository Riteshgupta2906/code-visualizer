import ProjectInput from "@/components/ProjectInput";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-slate-700 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-2xl shadow-lg shadow-slate-700/50">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-6 drop-shadow-lg">
            Next.js Code Visualizer
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Analyze and visualize your Next.js App Router project structure,
            dependencies, and routing patterns with interactive diagrams and
            insights.
          </p>
        </div>

        {/* Project Input Section */}
        <div className="max-w-2xl mx-auto mb-20">
          <ProjectInput />
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Powerful Analysis Features
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Get comprehensive insights into your codebase with our advanced
              visualization tools
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* App Router Analysis */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-blue-700/15 to-blue-800/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900/60 via-black/60 to-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:shadow-blue-500/20 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                <div className="w-12 h-12 bg-blue-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-blue-500/30 mb-4">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  App Router Analysis
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Visualize your Next.js 13+ App Router structure with route
                  groups, dynamic routes, and special files.
                </p>
              </div>
            </div>

            {/* Dependency Tracking */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/30 via-green-700/15 to-green-800/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900/60 via-black/60 to-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:shadow-green-500/20 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                <div className="w-12 h-12 bg-green-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-500/30 mb-4">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Dependency Tracking
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Map out import relationships and dependencies between your
                  components and modules.
                </p>
              </div>
            </div>

            {/* Interactive Flow */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-purple-700/15 to-purple-800/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900/60 via-black/60 to-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:shadow-purple-500/20 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                <div className="w-12 h-12 bg-purple-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-purple-500/30 mb-4">
                  <svg
                    className="w-6 h-6 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Interactive Flow
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Navigate through your codebase with an interactive flow
                  diagram showing relationships.
                </p>
              </div>
            </div>

            {/* Code Insights */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/30 via-orange-700/15 to-orange-800/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900/60 via-black/60 to-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:shadow-orange-500/20 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                <div className="w-12 h-12 bg-orange-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-orange-500/30 mb-4">
                  <svg
                    className="w-6 h-6 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Code Insights
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Get detailed analysis of API routes, middleware, and special
                  Next.js files.
                </p>
              </div>
            </div>

            {/* Fast Processing */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 via-pink-700/15 to-pink-800/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900/60 via-black/60 to-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:shadow-pink-500/20 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                <div className="w-12 h-12 bg-pink-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-pink-500/30 mb-4">
                  <svg
                    className="w-6 h-6 text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Fast Processing
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Quick analysis and visualization generation for projects of
                  any size.
                </p>
              </div>
            </div>

            {/* Detailed Reports */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-indigo-700/15 to-indigo-800/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900/60 via-black/60 to-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:shadow-indigo-500/20 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                <div className="w-12 h-12 bg-indigo-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-indigo-500/30 mb-4">
                  <svg
                    className="w-6 h-6 text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Detailed Reports
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Generate comprehensive reports and documentation for your
                  project structure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
