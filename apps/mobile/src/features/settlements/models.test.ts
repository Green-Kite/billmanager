import { describe, expect, it } from 'vitest';

import { deriveSettlementSummary } from './models';

describe('settlement summary', () => {
  it('rolls people up by balance direction', () => {
    expect(deriveSettlementSummary([
      { balance: 75, direction: 'owes-you' },
      { balance: -20, direction: 'you-owe' },
      { balance: 0, direction: 'settled' },
    ])).toEqual({ owedToYou: 75, youOwe: 20, net: 55, outstandingPeople: 2 });
  });
});
