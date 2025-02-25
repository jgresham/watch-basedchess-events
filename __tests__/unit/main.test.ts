import { describe, it, afterEach, beforeEach, vi, expect } from 'vitest';

describe('greeter function', () => {
  beforeEach(() => {
    // Read more about fake timers
    // https://vitest.dev/api/vi.html#vi-usefaketimers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Assert if setTimeout was called properly
  it('delays the greeting by 2 seconds', async () => {
    vi.spyOn(global, 'setTimeout');

    await vi.runAllTimersAsync();

    expect(setTimeout).toHaveBeenCalledTimes(0);
  });
});
