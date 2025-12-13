import fs from "fs";
import path from "path";
import os from "os";
import simpleGit from "simple-git";
import { v4 as uuidv4 } from "uuid";

const TEMP_PREFIX = "nextjs-visualizer-";

export class ProjectManager {
  /**
   * Prepares a project for analysis.
   * If pathOrUrl is a URL, it clones the repo to a temp directory.
   * If it's a local path, it returns it as is.
   */
  async prepareProject(pathOrUrl) {
    const isUrl =
      pathOrUrl.startsWith("http://") ||
      pathOrUrl.startsWith("https://") ||
      pathOrUrl.startsWith("git@");

    if (isUrl) {
      return this.cloneRepository(pathOrUrl);
    }

    // It's a local path
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
    const tempDir = os.tmpdir();
    const projectId = uuidv4();
    const projectDir = path.join(tempDir, `${TEMP_PREFIX}${projectId}`);

    try {
      console.log(`Cloning ${url} to ${projectDir}...`);
      
      // Use depth 1 for faster cloning (shallow clone)
      await simpleGit().clone(url, projectDir, { "--depth": 1 });

      return {
        path: projectDir,
        isTemp: true,
        id: projectId,
        originalUrl: url,
      };
    } catch (error) {
      // Cleanup if failed
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async cleanupProject(projectInfo) {
    if (projectInfo && projectInfo.isTemp && projectInfo.path) {
      try {
        console.log(`Cleaning up temp directory: ${projectInfo.path}`);
        if (fs.existsSync(projectInfo.path)) {
          fs.rmSync(projectInfo.path, { recursive: true, force: true });
        }
      } catch (error) {
        console.error(`Failed to cleanup temp directory: ${error.message}`);
      }
    }
  }
}

export const projectManager = new ProjectManager();
