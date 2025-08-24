import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

config({ path: '.dev.vars' });

const databaseUrl = drizzle(postgres(`${process.env.DATABASE_URL}`));

const main = async () => {
	try {
		await migrate(databaseUrl, { migrationsFolder: 'migrations' });
		console.log('Migration complete');
		process.exit(0);
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};
main();
