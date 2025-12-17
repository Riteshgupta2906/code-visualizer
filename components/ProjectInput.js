"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight, Folder, Github, ChevronDown, ExternalLink, Sparkles, Code2 } from "lucide-react";

const HOSTED_REPOS = [
  { 
    name: "Formbricks", 
    description: "Open source survey platform & experience management",
    url: "https://github.com/formbricks/formbricks.git",
    // highlight: true
  },
   { 
    name: "Dub.co", 
    description: "Open-source link management infrastructure",
    url: "https://github.com/dubinc/dub.git" 
  },
  { 
    name: "Papermark", 
    description: "Open-source document sharing alternative to DocSend",
    url: "https://github.com/mfts/papermark.git" 
  },
  { 
    name: "Inbox Zero", 
    description: "Open source email app for newsletter cleaning",
    url: "https://github.com/elie222/inbox-zero.git" 
  },
  { 
    name: "Munia", 
    description: "Next.js App Router & Prisma starter",
    url: "https://github.com/leandronorcio/munia.git" 
  },
 
 
];

export default function ProjectInput() {
  const isHostedMode = process.env.NEXT_PUBLIC_IS_HOSTED === 'true';
  
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [inputType, setInputType] = useState("local"); // 'local' | 'github'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isHostedMode) {
      setInputType("github");
    }
  }, [isHostedMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      setError("Please enter a valid path or GitHub URL");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      // Pre-validate by calling the API. This ensures we catch private repo errors
      // or invalid paths BEFORE navigating to the analyze page.
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectPath: inputValue.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to access repository");
      }

      // If successful, the repo is cloned/verified and cached.
      // We can now safely navigate.
      router.push(`/analyze?path=${encodeURIComponent(inputValue.trim())}`);
      
    } catch (err) {
      setError(err.message);
      setIsAnalyzing(false);
    }
  };

  const handleTypeSelect = (type) => {
    setInputType(type);
    setIsDropdownOpen(false);
    setInputValue("");
    setError("");
  };

  const handleRepoSelect = (url) => {
    setInputValue(url);
    setIsRepoDropdownOpen(false);
    setError("");
  };

  const openOnGithub = () => {
    if (inputValue && (inputValue.startsWith("http") || inputValue.startsWith("git"))) {
        const urlRaw = inputValue.replace(/\.git$/, "");
        window.open(urlRaw, "_blank");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="relative group z-20">
        {/* Glow effect behind input bar */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 bg-black/80 backdrop-blur-xl border border-gray-800 rounded-xl p-3 md:p-1.5 shadow-2xl">
          {/* Hosted Mode UI: Only Dropdown */}
          {isHostedMode ? (
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsRepoDropdownOpen(!isRepoDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors md:min-w-[300px]"
              >
                 <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400">Selected Repo:</span>
                    <span className="text-white">{HOSTED_REPOS.find(r => r.url === inputValue)?.name || "Select a featured repo..."}</span>
                 </div>
                 <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isRepoDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRepoDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                  {HOSTED_REPOS.map((repo) => (
                    <button
                      key={repo.url}
                      type="button"
                      onClick={() => handleRepoSelect(repo.url)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-between group"
                    >
                      <span className="font-medium">{repo.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Standard Mode UI */
            <>
              {/* Custom Dropdown */}
              <div className="relative w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full md:w-auto flex items-center justify-between md:justify-start gap-2 px-4 py-3 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors border-b md:border-b-0 md:border-r border-gray-800 md:mr-2 md:min-w-[140px]"
                >
                  {inputType === "local" ? (
                    <>
                      <Folder className="w-4 h-4 text-purple-400" />
                      <span>Local Path</span>
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4 text-purple-400" />
                      <span>GitHub URL</span>
                    </>
                  )}
                  <ChevronDown className={`w-3 h-3 ml-auto text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                    <button
                      type="button"
                      onClick={() => handleTypeSelect("local")}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <Folder className="w-4 h-4 text-purple-400" />
                      Local Project Path
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeSelect("github")}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <Github className="w-4 h-4 text-purple-400" />
                      GitHub Repository
                    </button>
                  </div>
                )}
              </div>

              {/* Input Field */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputType === "local" 
                  ? "/Users/username/projects/my-app" 
                  : "https://github.com/username/repo"}
                className="flex-1 bg-transparent border-none text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0 px-2 text-base h-12 md:h-full min-h-[44px]"
                disabled={isAnalyzing}
              />
            </>
          )}

          {/* Open on Github Button */}
          {inputValue && (inputType === 'github' || inputValue.startsWith('http')) && (
                <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
               <Button
                type="button"
                variant="ghost" 
                size="icon"
                onClick={openOnGithub}
                className="hidden md:flex mr-2 text-gray-400 hover:text-white shrink-0"
                title="Open repository"
               >
                   <ExternalLink className="w-4 h-4" />
               </Button>
               {/* Mobile only text link version */}
                <Button
                type="button"
                variant="ghost" 
                onClick={openOnGithub}
                className="flex md:hidden w-full text-gray-400 hover:text-white justify-center items-center gap-2 h-10 border border-gray-800 rounded-lg mb-2"
               >
                   <ExternalLink className="w-4 h-4" />
                   <span className="text-sm">View on GitHub</span>
               </Button>
               </div>
          )}

          {/* Analyze Button */}
          <Button
            type="submit"
            disabled={isAnalyzing}
            className="h-11 px-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium rounded-lg shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto mt-2 md:mt-0"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Analyze
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>
      </form>
      
      {error && (
        <Alert variant="destructive" className="bg-red-900/10 border-red-900/20 text-red-400 rounded-xl animate-in fade-in slide-in-from-top-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Suggested Repos Section */}
      <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-2 mb-6 justify-center text-gray-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">You can try these repos that use Next App routing and Prisma</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HOSTED_REPOS.map((repo) => (
            <div
              key={repo.url}
              className={`relative group overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20 ${
                repo.highlight 
                  ? 'bg-gradient-to-br from-purple-900/20 to-black/80 border-purple-500/30 md:col-span-2' 
                  : 'bg-black/40 border-white/5 hover:border-purple-500/20'
              }`}
            >
              {repo.highlight && (
                 <div className="absolute top-0 right-0 p-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Top Pick
                    </span>
                 </div>
              )}

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className={`font-semibold mb-1 flex items-center gap-2 ${repo.highlight ? 'text-white text-lg' : 'text-gray-200'}`}>
                    {repo.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {repo.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-auto">
                    <Button
                      type="button"
                      onClick={() => {
                        handleRepoSelect(repo.url);
                        setInputType("github");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      variant="secondary"
                      className="bg-purple-600/10 text-purple-300 hover:bg-purple-600/20 hover:text-purple-200 border border-purple-500/20 h-9 text-xs"
                    >
                      <Code2 className="w-3.5 h-3.5 mr-1.5" />
                      Open on Code Eye
                    </Button>

                    <Button
                      type="button"
                      onClick={() => window.open(repo.url, "_blank")}
                      variant="ghost" 
                      className="text-gray-400 hover:text-white hover:bg-white/5 h-9 text-xs"
                    >
                      <Github className="w-3.5 h-3.5 mr-1.5" />
                      Open on GitHub
                    </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}