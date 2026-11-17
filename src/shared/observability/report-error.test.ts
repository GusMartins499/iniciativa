import { type Context, context, ROOT_CONTEXT, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLogger } from "../logger";
import { reportError } from "./report-error";

function memoryDestination() {
  const lines: string[] = [];
  return {
    lines,
    write(chunk: string) {
      lines.push(chunk);
    },
  };
}

// Context manager síncrono: o suficiente para o span ficar ativo dentro do `context.with`.
function stackContextManager() {
  const stack: Context[] = [];
  return {
    active: () => stack.at(-1) ?? ROOT_CONTEXT,
    with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
      ctx: Context,
      fn: F,
      thisArg?: ThisParameterType<F>,
      ...args: A
    ): ReturnType<F> {
      stack.push(ctx);
      try {
        return fn.call(thisArg, ...args);
      } finally {
        stack.pop();
      }
    },
    bind: <T>(_ctx: Context, target: T): T => target,
    enable() {
      return this;
    },
    disable() {
      stack.length = 0;
      return this;
    },
  };
}

describe("shared/observability/reportError", () => {
  let spans: InMemorySpanExporter;
  let provider: BasicTracerProvider;

  beforeEach(() => {
    context.setGlobalContextManager(stackContextManager());
    spans = new InMemorySpanExporter();
    provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(spans)] });
  });

  afterEach(() => {
    context.disable();
  });

  it("loga com error e anexa o erro", () => {
    const destination = memoryDestination();

    reportError(
      new Error("falha no banco"),
      { event: "meetup.create_failed", meetupId: "m1" },
      createLogger(destination, "info", false),
    );

    const line = JSON.parse(destination.lines.join("")) as Record<string, unknown>;
    expect(line.level).toBe(50);
    expect(line.event).toBe("meetup.create_failed");
    expect(line.meetupId).toBe("m1");
    expect(line.err).toMatchObject({ type: "Error", message: "falha no banco" });
  });

  it("registra a exceção e marca o status ERROR no span ativo", () => {
    const span = provider.getTracer("teste").startSpan("action");

    context.with(trace.setSpan(context.active(), span), () => {
      reportError(
        new Error("falha no banco"),
        { event: "meetup.create_failed" },
        createLogger(memoryDestination(), "info", false),
      );
    });
    span.end();

    const finished = spans.getFinishedSpans()[0];
    expect(finished?.status.code).toBe(SpanStatusCode.ERROR);
    expect(finished?.events.map((event) => event.name)).toEqual(["exception"]);
    expect(finished?.events[0]?.attributes?.["exception.message"]).toBe("falha no banco");
  });

  it("não falha quando não há span ativo", () => {
    const destination = memoryDestination();

    expect(() =>
      reportError(
        "erro sem stack",
        { event: "x.failed" },
        createLogger(destination, "info", false),
      ),
    ).not.toThrow();
    expect(destination.lines.join("")).toContain('"event":"x.failed"');
    expect(spans.getFinishedSpans()).toHaveLength(0);
  });
});
