import archiver from "archiver";
import { Writable } from "stream";

export interface ProjectFile {
  path: string;   // e.g. "index.html", "css/styles.css"
  content: string;
}

export interface GeneratedProject {
  projectName: string;
  files: ProjectFile[];
}

// Takes an array of project files and returns a zip buffer
export async function createZip(files: ProjectFile[], projectName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const writable = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        cb();
      },
    });

    writable.on("finish", () => resolve(Buffer.concat(chunks)));
    writable.on("error", reject);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", reject);
    archive.pipe(writable);

    for (const file of files) {
      // Store inside a folder named after the project
      archive.append(file.content, { name: `${projectName}/${file.path}` });
    }

    archive.finalize();
  });
}
