export enum LogType {
	Info = 'info',
	Error = 'error',
	Warning = 'warning',
}

export enum LogOperation {
	Request = 'Request',
	Response = 'Response',
}

export interface ErrorOpts {
	exception?: string;
	originalPayload?: string;
}

export interface ILogData {
	message: string;

	[key: string]: unknown;
}

export type PrimitiveType = string | number | boolean | null | undefined;

export type LoggerTags = Record<string, PrimitiveType>;

export type LogFn = (message: string | ILogData | Error, tags?: Record<string, string>) => void;

export interface ILogger {
	info: LogFn;
	warn: LogFn;
	error: LogFn;
}

export class LoggerFactory {
	public createLogger(name: string): Logger {
		return new Logger(name);
	}
}

export class Logger implements ILogger {
	constructor(private readonly name: string) {}

	public info(message: string | ILogData | Error, tags?: LoggerTags): void {
		console.log({ name: this.name, type: LogType.Info, payload: message, ...tags });
	}

	public error(message: string | ILogData | Error, tags?: LoggerTags): void {
		console.error({ name: this.name, type: LogType.Error, payload: message, ...tags });
	}

	public warn(message: string | ILogData | Error, tags?: LoggerTags): void {
		console.warn({ name: this.name, type: LogType.Warning, payload: message, ...tags });
	}
}
