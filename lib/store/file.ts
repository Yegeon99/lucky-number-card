import { promises as fs } from "node:fs";
import path from "node:path";
import type { Registration, StoreBackend } from "./types";

/**
 * 단일 JSON 파일 백엔드. 로컬 개발과 노트북 시연용.
 * 파일 위치는 LNC_STORE_FILE 로 바꿀 수 있다(테스트에서 임시 경로 사용).
 */
type StoreFile = { registrations: Record<string, Registration> };

export function createFileBackend(filePath = process.env.LNC_STORE_FILE || path.join(process.cwd(), "data", "registrations.json")): StoreBackend {
  // 동시 요청이 겹칠 때 파일이 깨지지 않도록 쓰기를 직렬화한다.
  let queue: Promise<unknown> = Promise.resolve();
  function serialize<T>(task: () => Promise<T>): Promise<T> {
    const next = queue.then(task, task);
    queue = next.catch(() => undefined);
    return next;
  }

  async function read(): Promise<StoreFile> {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<StoreFile>;
      return { registrations: parsed.registrations ?? {} };
    } catch {
      return { registrations: {} };
    }
  }

  async function write(data: StoreFile): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, filePath);
  }

  return {
    async get(cardId) {
      const data = await read();
      return data.registrations[cardId] ?? null;
    },
    async list() {
      const data = await read();
      return Object.values(data.registrations);
    },
    mutate(cardId, fn) {
      return serialize(async () => {
        const data = await read();
        const { next, result } = await fn(data.registrations[cardId] ?? null);
        if (next) data.registrations[cardId] = next;
        else delete data.registrations[cardId];
        await write(data);
        return result;
      });
    },
    reset() {
      return serialize(() => write({ registrations: {} }));
    },
  };
}
