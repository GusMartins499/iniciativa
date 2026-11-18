export {
  createLogFlushSpanProcessor,
  createLogRecordProcessor,
} from "./create-log-record-processor";
export { annotateActiveSpan } from "./annotate-active-span";
export { createTraceExporter } from "./create-trace-exporter";
export { redactSpanAttributes, redactSpanName } from "./redact-span-attributes";
export { reportError } from "./report-error";
