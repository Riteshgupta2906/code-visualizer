import fs from "fs";
import path from "path";
import simpleGit from "simple-git";
import crypto from "crypto";

const TEMP_PREFIX = "nextjs-visualizer-";
const URL_MARKER_FILE = ".repo-url";

// Track in-progress clones
const activeClones = new Map();

export class ProjectManager {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'tmp');
    
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      console.log('Created temp directory:', this.tempDir);
    }
  }

  async prepareProject(pathOrUrl) {
    const isUrl =
      pathOrUrl.startsWith("http://") ||
      pathOrUrl.startsWith("https://") ||
      pathOrUrl.startsWith("git@");

    if (isUrl) {
      return this.cloneRepository(pathOrUrl);
    }

    if (!fs.existsSync(pathOrUrl)) {
      throw new Error(`Local path does not exist: ${pathOrUrl}`);
    }

    return {
      path: pathOrUrl,
      isTemp: false,
      originalUrl: null,
    };
  }

  async cloneRepository(url) {
    const projectId = crypto.createHash('md5').update(url).digest('hex');
    const targetDir = path.join(this.tempDir, `${TEMP_PREFIX}${projectId}`);

    // ✅ Check if this URL is already being cloned
    if (activeClones.has(projectId)) {
      console.log(`⏳ Clone already in progress for ${url}, waiting...`);
      return activeClones.get(projectId);
    }

    // ✅ Check cache first (before starting any clone)
    if (fs.existsSync(targetDir)) {
      const markerPath = path.join(targetDir, URL_MARKER_FILE);
      
      if (fs.existsSync(markerPath)) {
        try {
          const storedUrl = fs.readFileSync(markerPath, 'utf8').trim();
          if (storedUrl === url) {
            console.log(`✓ Cache HIT: ${url}`);
            return {
              path: targetDir,
              isTemp: true,
              id: projectId,
              originalUrl: url,
            };
          }
        } catch (e) {
          console.warn(`Marker file corrupt: ${e.message}`);
        }
      }
      
      // Invalid cache - remove it
      console.log(`Removing corrupted/different repo at: ${targetDir}`);
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    // ✅ Create a promise for this clone and store it
    const clonePromise = this._doClone(url, projectId, targetDir);
    activeClones.set(projectId, clonePromise);

    try {
      const result = await clonePromise;
      return result;
    } finally {
      // ✅ Remove from active clones when done (success or failure)
      activeClones.delete(projectId);
    }
  }

  async _doClone(url, projectId, targetDir) {
    console.log(`Cache MISS. Cleaning up old projects...`);
    this._cleanupAllOtherProjects(projectId);

    try {
      console.log(`Cloning ${url} to ${targetDir}...`);
      
      // Ensure tmp directory exists
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      
      const git = simpleGit(this.tempDir);
      const folderName = `${TEMP_PREFIX}${projectId}`;
      
      await git.clone(url, folderName, {
        '--depth': 1,
      });

      if (!fs.existsSync(targetDir)) {
        throw new Error(`Git clone completed but directory not found!`);
      }

      // Create marker file
      const markerPath = path.join(targetDir, URL_MARKER_FILE);
      fs.writeFileSync(markerPath, url, 'utf8');
      
      console.log(`✓ Clone SUCCESS`);
      console.log(`✓ Saved to: ${targetDir}`);

      return {
        path: targetDir,
        isTemp: true,
        id: projectId,
        originalUrl: url,
      };

    } catch (error) {
      console.error(`Clone FAILED: ${error.message}`);
      
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }

      // Check for common private repo / auth errors
      const lowerError = error.message.toLowerCase();
      if (
        lowerError.includes('authentication failed') || 
        lowerError.includes('could not read username') || 
        lowerError.includes('repository not found') ||
        lowerError.includes('authorization required')
      ) {
        throw new Error("PRIVATE_REPO_ACCESS_DENIED");
      }
      
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  _cleanupAllOtherProjects(keepProjectId) {
    try {
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
        return;
      }

      const files = fs.readdirSync(this.tempDir);
      const projects = [];

      for (const file of files) {
        if (!file.startsWith(TEMP_PREFIX)) continue;
        if (file === `${TEMP_PREFIX}${keepProjectId}`) continue;

        const fullPath = path.join(this.tempDir, file);
        try {
          const stats = fs.statSync(fullPath);
          projects.push({
            path: fullPath,
            mtime: stats.mtimeMs
          });
        } catch (e) {
          // Ignore if file disappears
        }
      }

      // Only clean if we have more than 3 other projects
      if (projects.length <= 4) return;

      // Keep the 3 most recent projects
      projects.sort((a, b) => b.mtime - a.mtime);
      const toRemove = projects.slice(4);

      let removedCount = 0;
      for (const proj of toRemove) {
        console.log(`Deleting old project: ${proj.path}`);
        try {
          fs.rmSync(proj.path, { recursive: true, force: true });
          removedCount++;
        } catch (e) {
          console.warn(`Failed to delete ${proj.path}: ${e.message}`);
        }
      }

      if (removedCount > 0) {
        console.log(`✓ Removed ${removedCount} old project(s)`);
      }
    } catch (e) {
      console.error(`Cleanup error: ${e.message}`);
    }

    // Ensure tmp folder exists after cleanup
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async cleanupProject(projectInfo) {
    if (projectInfo && projectInfo.isTemp && projectInfo.path) {
      try {
        console.log(`Cleaning up: ${projectInfo.path}`);
        if (fs.existsSync(projectInfo.path)) {
          fs.rmSync(projectInfo.path, { recursive: true, force: true });
        }
      } catch (error) {
        console.error(`Cleanup failed: ${error.message}`);
      }
    }
  }
}

export const projectManager = new ProjectManager();