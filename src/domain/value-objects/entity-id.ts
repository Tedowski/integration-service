import { z } from 'zod';

export const EntityIdSchema = z.string().uuid();
export type EntityId = z.infer<typeof EntityIdSchema>;

export class EntityIdVO {
	private constructor(private readonly value: string) {}

	static create(value: string): EntityIdVO {
		const parsed = EntityIdSchema.parse(value);
		return new EntityIdVO(parsed);
	}

	static generate(): EntityIdVO {
		return new EntityIdVO(crypto.randomUUID());
	}

	toString(): string {
		return this.value;
	}

	equals(other: EntityIdVO): boolean {
		return this.value === other.value;
	}
}
