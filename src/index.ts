// src/index.ts - Main Cloudflare Worker Entry Point
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { Container } from './container';
import { requestContextMiddleware } from './presentation/middleware/request-context.middleware';
import { errorHandlerMiddleware } from './presentation/middleware/error-handler.middleware';
import { createConnectionRoutes } from './routes/connection.routes';

export interface HonoAppBindings {
	Bindings: Env;
	Variables: {
		container: Container;
	};
}

export type HonoApp = OpenAPIHono<HonoAppBindings>;

const app = new OpenAPIHono<HonoAppBindings>();

// Global middleware
app.use('*', logger());
app.use(
	'*',
	cors({
		origin: ['http://localhost:8080', 'http://127.0.0.1:8080', '*', 'http://localhost:5173', 'http://127.0.0.1:5173'],
		allowHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-user-id', 'Accept', 'Accept-Language', 'Content-Language', 'Range'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
		exposeHeaders: ['x-request-id', 'x-correlation-id'],
		credentials: true,
		maxAge: 86400, // 24 hours
	}),
);
app.use('*', errorHandlerMiddleware());
app.use('*', requestContextMiddleware());

// Container injection middleware for API routes
app.use('/api/v1/*', async (c, next) => {
	const container = new Container(c.env);
	c.set('container', container);
	await next();
});

// Health check endpoint with OpenAPI documentation
const healthRoute = createRoute({
	method: 'get',
	path: '/health',
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.object({
						status: z.string(),
						timestamp: z.string(),
						version: z.string(),
					}),
				},
			},
			description: 'Service is healthy',
		},
	},
	tags: ['Health'],
	summary: 'Health check',
	description: 'Check if the service is running and healthy',
});

app.openapi(healthRoute, (c) => {
	return c.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
	});
});

// API routes - mount files under /files prefix
// TODO: Uncomment when file routes are ready
// const fileRoutes = createFileRoutes();
// app.route('/api/v1/files', fileRoutes);

app.route('/api/v1/connections', createConnectionRoutes());

// Root redirect to docs
app.get('/', (c) => {
	return c.redirect('/docs');
});

// OpenAPI documentation
app.doc('/openapi.json', {
	openapi: '3.0.0',
	info: {
		version: '1.0.0',
		title: 'Integration service API',
		description: 'API for file uploads and connection management',
	},
	servers: [
		{
			url: 'http://localhost:8080',
			description: 'Development server',
		},
		{
			url: 'https://integration-service.teddcz.workers.dev',
			description: 'Production server',
		},
	],
	tags: [
		{
			name: 'Files',
			description: 'File upload and management operations',
		},
		{
			name: 'Connections',
			description: 'Manage Merge connections',
		},
		{
			name: 'Health',
			description: 'Service health check',
		},
	],
});

// Swagger UI with better configuration
app.get(
	'/docs',
	swaggerUI({
		url: '/openapi.json',
		// config: {
		// 	deepLinking: true,
		// 	displayOperationId: false,
		// 	defaultModelsExpandDepth: 1,
		// 	defaultModelExpandDepth: 1,
		// 	defaultModelRendering: 'example',
		// 	displayRequestDuration: true,
		// 	docExpansion: 'list',
		// 	filter: false,
		// 	showExtensions: false,
		// 	showCommonExtensions: false,
		// 	tryItOutEnabled: true,
		// },
	}),
);

// Alternative documentation route
app.get('/swagger', swaggerUI({ url: '/openapi.json' }));

// 404 handler
app.notFound((c) => {
	return c.json(
		{
			success: false,
			error: {
				code: 'NOT_FOUND',
				message: 'The requested resource was not found',
			},
		},
		404,
	);
});

export default app;
