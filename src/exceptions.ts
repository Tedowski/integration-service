import { ILogger } from './logger/logger';

export class ApplicationException extends Error {
	public readonly cause?: unknown;

	constructor(msg?: string, opts?: { cause?: unknown }) {
		super(msg);
		this.name = this.constructor.name;
		this.cause = opts?.cause;
	}
}

export class AuthenticationError extends ApplicationException {
	constructor(
		message: string,
		public readonly error?: unknown,
	) {
		super(message);
	}
}

export class ContextNotFoundException extends ApplicationException {
	constructor() {
		super('Operation context not found');
	}
}

export class ContextAlreadyExistsException extends ApplicationException {
	constructor() {
		super('Operation context already exists');
	}
}

export const logExceptionAndThrow = (logger: ILogger, exception: unknown): never => {
	logger.error(exception as Error); // Only for debug
	const err = exception instanceof ApplicationException ? exception : new ApplicationException('Something went wrong', { cause: exception });
	logger.error(err);
	throw err;
};
