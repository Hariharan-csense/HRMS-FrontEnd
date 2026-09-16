import { describe, expect, it } from 'vitest';
import { hasActiveLoginSubscription } from './loginSubscription';

const now = Date.parse('2026-09-16T10:00:00Z');
describe('login subscription routing', () => {
  it('allows an active paid plan', () => {
    expect(hasActiveLoginSubscription({ status: 'active', end_date: '2026-09-17T10:00:00Z' }, now)).toBe(true);
  });
  it('rejects elapsed paid plans even with a stale active status', () => {
    expect(hasActiveLoginSubscription({ status: 'active', end_date: '2026-09-16T10:00:00Z' }, now)).toBe(false);
  });
  it('allows a current trial and respects server expiry', () => {
    expect(hasActiveLoginSubscription({ status: 'trial', is_trial_active: true, trial_end_date: '2026-09-17T10:00:00Z' }, now)).toBe(true);
    expect(hasActiveLoginSubscription({ status: 'trial', is_trial_active: false, trial_end_date: '2026-09-17T10:00:00Z' }, now)).toBe(false);
    expect(hasActiveLoginSubscription({ status: 'trial', is_trial_active: true, trial_end_date: '2026-09-15T10:00:00Z' }, now)).toBe(false);
  });
  it('rejects missing, expired, cancelled and invalid subscriptions', () => {
    for (const subscription of [null, { status: 'expired' }, { status: 'cancelled' }, { status: 'active', end_date: 'invalid' }]) {
      expect(hasActiveLoginSubscription(subscription, now)).toBe(false);
    }
  });
  it('preserves internal company access', () => {
    expect(hasActiveLoginSubscription({ is_internal_company: true }, now)).toBe(true);
  });
});
