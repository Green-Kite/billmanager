export interface PasskeyCeremonyAdapter {
  isSupported(): Promise<boolean>;
  createCredential(options: Record<string, unknown>): Promise<Record<string, unknown>>;
  getCredential(options: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export class PasskeyUnavailableError extends Error {
  constructor(
    message = 'Passkeys require the BillManager native credential adapter, which is not available in this build.',
  ) {
    super(message);
    this.name = 'PasskeyUnavailableError';
  }
}

export const unsupportedPasskeyAdapter: PasskeyCeremonyAdapter = {
  isSupported: async () => false,
  createCredential: async () => {
    throw new PasskeyUnavailableError();
  },
  getCredential: async () => {
    throw new PasskeyUnavailableError();
  },
};

interface NativePasskeyModule {
  isSupported(): Promise<boolean>;
  createCredential(optionsJson: string): Promise<string>;
  getCredential(optionsJson: string): Promise<string>;
}

type NativePasskeyModuleLoader = () => Promise<NativePasskeyModule | null>;

const loadBundledPasskeyModule: NativePasskeyModuleLoader = async () => {
  const imported = await import('../../../modules/billmanager-passkeys/src/BillManagerPasskeysModule');
  return imported.default;
};

function parseCredentialResponse(responseJson: string): Record<string, unknown> {
  const parsed = JSON.parse(responseJson) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('The native passkey provider returned an invalid credential response.');
  }
  return parsed as Record<string, unknown>;
}

export function createNativePasskeyAdapter(
  loadModule: NativePasskeyModuleLoader = loadBundledPasskeyModule,
): PasskeyCeremonyAdapter {
  const requireModule = async (): Promise<NativePasskeyModule> => {
    try {
      const module = await loadModule();
      if (module) return module;
    } catch {
      // The native module is intentionally absent in Expo Go and web previews.
    }
    throw new PasskeyUnavailableError();
  };

  return {
    isSupported: async () => {
      try {
        const module = await loadModule();
        return module ? module.isSupported() : false;
      } catch {
        return false;
      }
    },
    createCredential: async (options) => {
      const module = await requireModule();
      return parseCredentialResponse(await module.createCredential(JSON.stringify(options)));
    },
    getCredential: async (options) => {
      const module = await requireModule();
      return parseCredentialResponse(await module.getCredential(JSON.stringify(options)));
    },
  };
}

export const nativePasskeyAdapter = createNativePasskeyAdapter();

export async function passkeyAvailability(
  adapter: PasskeyCeremonyAdapter,
  serverSupportsPasskeys: boolean,
): Promise<{ available: boolean; reason?: string }> {
  if (!serverSupportsPasskeys) {
    return { available: false, reason: 'Passkeys are not enabled on this server.' };
  }
  try {
    const supported = await adapter.isSupported();
    return supported
      ? { available: true }
      : {
          available: false,
          reason: 'This build does not include the native passkey credential adapter.',
        };
  } catch {
    return { available: false, reason: 'Passkey availability could not be checked.' };
  }
}
