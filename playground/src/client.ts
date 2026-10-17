import type { FormatRequest, FormatResponse } from "./types";

export class Formatter {
  #worker?: Worker;
  #timer?: ReturnType<typeof setTimeout>;
  #timeout?: ReturnType<typeof setTimeout>;
  #id = 0;
  constructor(
    private receive: (response: FormatResponse) => void,
    private fail: (message: string) => void,
    private busy: () => void,
  ) {}
  #start() {
    const worker = new Worker(new URL("./format.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<FormatResponse>) => {
      if (event.data.id !== this.#id) return;
      clearTimeout(this.#timeout);
      this.receive(event.data);
    };
    worker.onerror = (event) => {
      if (this.#worker !== worker) return;
      event.preventDefault();
      this.#reset();
      this.fail(
        `The formatter could not start. ${event.message || "Reload the page to retry."}`,
      );
    };
    this.#worker = worker;
    return worker;
  }
  #reset() {
    clearTimeout(this.#timeout);
    this.#worker?.terminate();
    this.#worker = undefined;
  }
  schedule(request: Omit<FormatRequest, "id">, immediate = false) {
    clearTimeout(this.#timer);
    clearTimeout(this.#timeout);
    const id = ++this.#id;
    this.busy();
    this.#timer = setTimeout(
      () => {
        try {
          (this.#worker ?? this.#start()).postMessage({ ...request, id });
          this.#timeout = setTimeout(() => {
            this.#reset();
            this.fail(
              "Formatting took longer than 20 seconds. Try a smaller example or another language plugin, then format again.",
            );
          }, 20_000);
        } catch (error) {
          this.#reset();
          this.fail(`The formatter could not start. ${String(error)}`);
        }
      },
      immediate ? 0 : 250,
    );
  }
  cancelPending() {
    ++this.#id;
    clearTimeout(this.#timer);
    clearTimeout(this.#timeout);
  }
  destroy() {
    clearTimeout(this.#timer);
    this.#reset();
  }
}
