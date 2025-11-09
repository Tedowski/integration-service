import { EntityIdVO } from '../value-objects/entity-id';

interface FailedFileSyncProps {
	fileId: string;
	accountId: string;
	reason: string;
	attemptedAt: Date;
}

export class FailedFileSync {
	constructor(
		public readonly id: EntityIdVO,
		public readonly fileId: string,
		public readonly accountId: string,
		public readonly reason: string,
		public readonly attemptedAt: Date,
	) {}

	static create(entity: FailedFileSyncProps): FailedFileSync {
		const { fileId, accountId, reason, attemptedAt } = entity;
		return new FailedFileSync(EntityIdVO.generate(), fileId, accountId, reason, attemptedAt);
	}
}
