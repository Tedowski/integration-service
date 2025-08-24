import { z } from 'zod';

export const FileIdSchema = z.string().uuid();
export type FileId = z.infer<typeof FileIdSchema>;

export class FileIdVO {
	private constructor(private readonly value: string) {}

	static create(value: string): FileIdVO {
		const parsed = FileIdSchema.parse(value);
		return new FileIdVO(parsed);
	}

	static generate(): FileIdVO {
		return new FileIdVO(crypto.randomUUID());
	}

	toString(): string {
		return this.value;
	}

	equals(other: FileIdVO): boolean {
		return this.value === other.value;
	}
}
