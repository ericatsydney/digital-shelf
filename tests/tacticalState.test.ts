import { describe, expect, it } from 'vitest';
import {
  initialTacticalState,
  tacticalReducer,
  type TacticalState,
} from '../src/state/tacticalState';

describe('tactical state reducer', () => {
  it('starts in a transient Hangar state with no unit or slot', () => {
    expect(initialTacticalState).toEqual({
      selectedUnitId: null,
      selectedSlotId: null,
      stageId: 'hangar',
      unitStatus: 'idle',
      captureStatus: 'idle',
      loadRequestId: 0,
    });
  });

  it('selects a unit, clears the slot, and creates the newest loading request', () => {
    const state: TacticalState = {
      ...initialTacticalState,
      selectedUnitId: 'old-unit',
      selectedSlotId: 'slot-alpha',
      loadRequestId: 4,
    };

    expect(tacticalReducer(state, { type: 'select-unit', unitId: 'new-unit' })).toEqual({
      ...state,
      selectedUnitId: 'new-unit',
      selectedSlotId: null,
      unitStatus: 'loading',
      loadRequestId: 5,
    });
  });

  it('selects a fixed deployment slot', () => {
    expect(
      tacticalReducer(initialTacticalState, { type: 'select-slot', slotId: 'slot-bravo' }),
    ).toMatchObject({ selectedSlotId: 'slot-bravo' });
  });

  it('changes the active stage', () => {
    expect(
      tacticalReducer(initialTacticalState, { type: 'select-stage', stageId: 'space' }),
    ).toMatchObject({ stageId: 'space' });
  });

  it('accepts ready only for the current unit load request', () => {
    const loadingState = tacticalReducer(initialTacticalState, {
      type: 'select-unit',
      unitId: 'haro-green',
    });

    expect(
      tacticalReducer(loadingState, { type: 'unit-ready', requestId: loadingState.loadRequestId }),
    ).toMatchObject({ unitStatus: 'ready' });
  });

  it('ignores stale ready and error actions', () => {
    const loadingState = tacticalReducer(initialTacticalState, {
      type: 'select-unit',
      unitId: 'haro-green',
    });
    const newestState = tacticalReducer(loadingState, {
      type: 'select-unit',
      unitId: 'other-unit',
    });

    expect(
      tacticalReducer(newestState, { type: 'unit-ready', requestId: loadingState.loadRequestId }),
    ).toBe(newestState);
    expect(
      tacticalReducer(newestState, { type: 'unit-error', requestId: loadingState.loadRequestId }),
    ).toBe(newestState);
  });

  it('sets and resets capture failure state', () => {
    const capturing = tacticalReducer(initialTacticalState, { type: 'capture-start' });
    const failed = tacticalReducer(capturing, { type: 'capture-error' });

    expect(capturing.captureStatus).toBe('capturing');
    expect(failed.captureStatus).toBe('error');
    expect(tacticalReducer(failed, { type: 'capture-reset' }).captureStatus).toBe('idle');
  });

  it('ignores unknown actions without changing state', () => {
    expect(tacticalReducer(initialTacticalState, { type: 'unknown' } as never)).toBe(
      initialTacticalState,
    );
  });
});
