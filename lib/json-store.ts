import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const processStore = globalThis as typeof globalThis & {
  __ashareJsonQueues?: Map<string, Promise<void>>;
};
const queues = processStore.__ashareJsonQueues ??= new Map<string, Promise<void>>();

/** Local JSON persistence. Read/modify/write transactions are serialized per file. */
export class JsonStore {
  private readonly directory: string;

  constructor(directory: string) {
    this.directory = directory;
  }

  private file(name: string): string {
    if (!/^[a-z0-9.-]+$/.test(name)) throw new Error("Invalid store name");
    return path.join(this.directory, `${name}.json`);
  }

  private async readFile<T>(name: string): Promise<T | null> {
    try {
      const value: unknown = JSON.parse(await fs.readFile(this.file(name), "utf8"));
      if (value === null) throw new Error(`[store] ${name}.json must not be null`);
      return value as T;
    } catch (error) {
      // A corrupt or inaccessible store must never be mistaken for a new store.
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  private enqueue<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const key = path.resolve(this.file(name));
    const run = (queues.get(key) ?? Promise.resolve()).then(operation);
    // A rejected write must not poison all subsequent writes to this file.
    const settled = run.then(() => {}, () => {});
    queues.set(key, settled);
    void settled.then(() => {
      if (queues.get(key) === settled) queues.delete(key);
    });
    return run;
  }

  private async writeFile(name: string, value: unknown, backup = false): Promise<void> {
    await fs.mkdir(this.directory, { recursive: true });
    const file = this.file(name);
    const tmp = `${file}.${randomUUID()}.tmp`;
    try {
      if (backup) {
        try {
          const previous = await fs.readFile(file, "utf8");
          await this.writeFile(`${name}.bak`, JSON.parse(previous));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }
      const handle = await fs.open(tmp, "wx", 0o600);
      try {
        await handle.writeFile(JSON.stringify(value, null, 2), "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fs.rename(tmp, file);
    } finally {
      await fs.rm(tmp, { force: true }).catch(() => {});
    }
  }

  read<T>(name: string): Promise<T | null> {
    return this.enqueue(name, () => this.readFile<T>(name));
  }

  readOrCreate<T>(name: string, initial: () => T, inspect?: (value: T) => Promise<void>): Promise<T> {
    return this.enqueue(name, async () => {
      const current = await this.readFile<T>(name);
      if (current !== null) {
        if (inspect) await inspect(current);
        return current;
      }
      const value = initial();
      await this.writeFile(name, value);
      return value;
    });
  }

  update<T>(
    name: string,
    initial: () => T,
    change: (current: T) => T | Promise<T>,
    options: { backup?: boolean; afterWrite?: (value: T) => Promise<void> } = {},
  ): Promise<T> {
    return this.enqueue(name, async () => {
      const current = (await this.readFile<T>(name)) ?? initial();
      const next = await change(current);
      await this.writeFile(name, next, options.backup);
      if (options.afterWrite) await options.afterWrite(next);
      return next;
    });
  }
}
