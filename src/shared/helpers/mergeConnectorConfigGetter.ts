import { MergeClient } from '@mergeapi/merge-node-client';

export const Connector = {
	// --- File Storage ---
	GoogleDrive: 'google_drive',
	Dropbox: 'dropbox',
	Box: 'box',
	// --- Ticketing ---
	Zendesk: 'zendesk',
	Jira: 'jira',
	Freshdesk: 'freshdesk',
	// --- CRM ---
	Salesforce: 'salesforce',
	Hubspot: 'hubspot',
	// --- ATS ---
	Greenhouse: 'greenhouse',
	Lever: 'lever',
	// --- HRIS ---
	Workday: 'workday',
	BambooHR: 'bamboohr',
	// --- Accounting ---
	QuickBooks: 'quickbooks',
	Xero: 'xero',
} as const;

/**
 * Connector mapping: your internal connector slug → Merge vertical namespace + category
 */
const CONNECTOR_MAP = {
	// --- File Storage ---
	[Connector.GoogleDrive]: { namespace: 'filestorage', category: 'filestorage' },
	[Connector.Dropbox]: { namespace: 'filestorage', category: 'filestorage' },
	[Connector.Box]: { namespace: 'filestorage', category: 'filestorage' },

	// --- Ticketing ---
	[Connector.Zendesk]: { namespace: 'ticketing', category: 'ticketing' },
	[Connector.Jira]: { namespace: 'ticketing', category: 'ticketing' },
	[Connector.Freshdesk]: { namespace: 'ticketing', category: 'ticketing' },

	// --- CRM ---
	[Connector.Salesforce]: { namespace: 'crm', category: 'crm' },
	[Connector.Hubspot]: { namespace: 'crm', category: 'crm' },

	// --- ATS ---
	[Connector.Greenhouse]: { namespace: 'ats', category: 'ats' },
	[Connector.Lever]: { namespace: 'ats', category: 'ats' },

	// --- HRIS ---
	[Connector.Workday]: { namespace: 'hris', category: 'hris' },
	[Connector.BambooHR]: { namespace: 'hris', category: 'hris' },

	// --- Accounting ---
	[Connector.QuickBooks]: { namespace: 'accounting', category: 'accounting' },
	[Connector.Xero]: { namespace: 'accounting', category: 'accounting' },
} as const;

export type ConnectorType = keyof typeof CONNECTOR_MAP;

export function getConnectorConfig(merge: MergeClient, connectorType: ConnectorType) {
	const cfg = CONNECTOR_MAP[connectorType];
	if (!cfg) {
		throw new Error(`Unsupported connector type: ${connectorType}`);
	}

	const namespace = merge[cfg.namespace];
	if (!namespace) {
		throw new Error(`Namespace not available in Merge client: ${cfg.namespace}`);
	}

	return {
		namespace,
		category: cfg.category,
	};
}
