"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight, Folder, Github, ChevronDown, ExternalLink } from "lucide-react";

const HOSTED_REPOS = [
  { name: "Munia", url: "https://github.com/leandronorcio/munia.git" },
  { name: "Dub.co", url: "https://github.com/dubinc/dub.git" },
  { name: "Papermark", url: "https://github.com/mfts/papermark.git" },
  { name: "Inbox Zero", url: "https://github.com/elie222/inbox-zero.git" },
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
    router.push(`/analyze?path=${encodeURIComponent(inputValue.trim())}`);
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

        <div className="relative flex items-center bg-black/80 backdrop-blur-xl border border-gray-800 rounded-xl p-1.5 shadow-2xl">
          {/* Hosted Mode UI: Only Dropdown */}
          {isHostedMode ? (
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsRepoDropdownOpen(!isRepoDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors min-w-[300px]"
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors border-r border-gray-800 mr-2 min-w-[140px]"
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
                className="flex-1 bg-transparent border-none text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0 px-2 text-base h-full"
                disabled={isAnalyzing}
              />
            </>
          )}

          {/* Open on Github Button */}
          {inputValue && (inputType === 'github' || inputValue.startsWith('http')) && (
               <Button
                type="button"
                variant="ghost" 
                size="icon"
                onClick={openOnGithub}
                className="mr-2 text-gray-400 hover:text-white"
                title="Open repository"
               >
                   <ExternalLink className="w-4 h-4" />
               </Button>
          )}

          {/* Analyze Button */}
          <Button
            type="submit"
            disabled={isAnalyzing}
            className="h-11 px-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium rounded-lg shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
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
    </div>
  );
}