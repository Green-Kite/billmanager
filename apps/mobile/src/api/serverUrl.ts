import {
  CLOUD_API_BASE_URL,
  DeploymentMode,
  PersistedServerProfile,
  profileIdForBaseUrl,
} from '../domain/serverProfile';

export class ServerUrlError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'invalid_url'
      | 'unsupported_protocol'
      | 'insecure_release_url',
  ) {
    super(message);
    this.name = 'ServerUrlError';
  }
}

export interface NormalizeServerUrlOptions {
  allowInsecure?: boolean;
}

export function normalizeServerUrl(
  input: string,
  options: NormalizeServerUrlOptions = {},
): string {
  const trimmed = input.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ServerUrlError('Enter a valid BillManager server URL.', 'invalid_url');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new ServerUrlError('BillManager servers must use HTTP or HTTPS.', 'unsupported_protocol');
  }
  if (parsed.protocol === 'http:' && !options.allowInsecure) {
    throw new ServerUrlError(
      'Release builds require HTTPS with a certificate trusted by this device.',
      'insecure_release_url',
    );
  }

  parsed.hash = '';
  parsed.search = '';
  parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  if (!parsed.pathname || parsed.pathname === '/') {
    parsed.pathname = '/api/v2';
  } else if (!parsed.pathname.endsWith('/api/v2')) {
    parsed.pathname = `${parsed.pathname}/api/v2`.replace(/\/{2,}/g, '/');
  }

  return parsed.toString().replace(/\/$/, '');
}

export function deploymentModeForUrl(baseUrl: string): DeploymentMode {
  if (baseUrl === CLOUD_API_BASE_URL) return 'saas';
  return baseUrl.startsWith('http:') ? 'development' : 'self_hosted';
}

export async function profileForUrl(
  input: string,
  options: NormalizeServerUrlOptions = {},
): Promise<PersistedServerProfile> {
  const baseUrl = normalizeServerUrl(input, options);
  const deploymentMode = deploymentModeForUrl(baseUrl);
  return {
    id: deploymentMode === 'saas'
      ? 'billmanager-cloud'
      : await profileIdForBaseUrl(baseUrl),
    displayName:
      deploymentMode === 'saas'
        ? 'BillManager Cloud'
        : new URL(baseUrl).hostname,
    baseUrl,
    deploymentMode,
    lastVerifiedAt: null,
    capabilities: null,
    selectedDatabase: null,
    isActive: true,
  };
}
