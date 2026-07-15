export type ProfileOperationKind = 'initialize' | 'verify' | 'add' | 'switch';

export interface ProfileOperationToken {
  generation: number;
  kind: ProfileOperationKind;
  expectedProfileId: string | null;
}

/**
 * Coordinates asynchronous profile workflows without coupling the guard to
 * React. Every user-visible profile operation invalidates earlier work as soon
 * as it starts. A candidate add can be retargeted once its normalized profile
 * identity is known, but only while it is still the newest operation.
 */
export class ProfileOperationGuard {
  private generation = 0;
  private expectedProfileId: string | null;

  constructor(initialProfileId: string | null) {
    this.expectedProfileId = initialProfileId;
  }

  begin(
    kind: ProfileOperationKind,
    expectedProfileId: string | null = this.expectedProfileId,
  ): ProfileOperationToken {
    this.generation += 1;
    this.expectedProfileId = expectedProfileId;
    return { generation: this.generation, kind, expectedProfileId };
  }

  capture(kind: ProfileOperationKind = 'verify'): ProfileOperationToken {
    return {
      generation: this.generation,
      kind,
      expectedProfileId: this.expectedProfileId,
    };
  }

  retarget(
    token: ProfileOperationToken,
    expectedProfileId: string,
  ): ProfileOperationToken | null {
    if (!this.isLatest(token)) return null;
    this.expectedProfileId = expectedProfileId;
    return { ...token, expectedProfileId };
  }

  isLatest(token: ProfileOperationToken): boolean {
    return token.generation === this.generation;
  }

  isCurrent(token: ProfileOperationToken, activeProfileId: string): boolean {
    return this.isLatest(token)
      && token.expectedProfileId === activeProfileId
      && this.expectedProfileId === activeProfileId;
  }

  cancel(): void {
    this.generation += 1;
    this.expectedProfileId = null;
  }
}

export class ProfileOperationSupersededError extends Error {
  constructor() {
    super('A newer server profile operation superseded this request.');
    this.name = 'ProfileOperationSupersededError';
  }
}
