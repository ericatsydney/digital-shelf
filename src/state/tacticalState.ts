export type TacticalState = {
  selectedUnitId: string | null;
  selectedSlotId: string | null;
  stageId: string;
  unitStatus: 'idle' | 'loading' | 'ready' | 'error';
  captureStatus: 'idle' | 'capturing' | 'error';
  loadRequestId: number;
};

export type TacticalAction =
  | { type: 'select-unit'; unitId: string }
  | { type: 'select-slot'; slotId: string }
  | { type: 'select-stage'; stageId: string }
  | { type: 'unit-ready'; requestId: number }
  | { type: 'unit-error'; requestId: number }
  | { type: 'capture-start' }
  | { type: 'capture-error' }
  | { type: 'capture-reset' };

export const initialTacticalState: TacticalState = {
  selectedUnitId: null,
  selectedSlotId: null,
  stageId: 'hangar',
  unitStatus: 'idle',
  captureStatus: 'idle',
  loadRequestId: 0,
};

export function tacticalReducer(state: TacticalState, action: TacticalAction): TacticalState {
  switch (action.type) {
    case 'select-unit':
      return {
        ...state,
        selectedUnitId: action.unitId,
        selectedSlotId: null,
        unitStatus: 'loading',
        loadRequestId: state.loadRequestId + 1,
      };
    case 'select-slot':
      return { ...state, selectedSlotId: action.slotId };
    case 'select-stage':
      return { ...state, stageId: action.stageId };
    case 'unit-ready':
      return action.requestId === state.loadRequestId ? { ...state, unitStatus: 'ready' } : state;
    case 'unit-error':
      return action.requestId === state.loadRequestId ? { ...state, unitStatus: 'error' } : state;
    case 'capture-start':
      return { ...state, captureStatus: 'capturing' };
    case 'capture-error':
      return { ...state, captureStatus: 'error' };
    case 'capture-reset':
      return { ...state, captureStatus: 'idle' };
    default:
      return state;
  }
}
