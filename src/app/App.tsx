import { useCallback, useEffect, useReducer, useState } from 'react';
import { loadCollection } from '../data/collection';
import { loadStages } from '../data/stages';
import type { CollectionRecord, StageRecord } from './types';
import { CommandSheet } from '../components/CommandSheet';
import { initialTacticalState, tacticalReducer } from '../state/tacticalState';
import { HeroCanvas } from '../scene/HeroCanvas';

const fallbackStage: StageRecord = {
  id: 'hangar',
  name: 'Hangar',
  background: '#07111f',
  gridColor: '#284c6e',
  accentColor: '#55d6ff',
  ambientIntensity: 0.6,
  directionalIntensity: 1.2,
  backdrop: {
    variant: 'hangar',
    particleCount: 0,
    motion: 0.2,
  },
};

export function App() {
  const [state, dispatch] = useReducer(tacticalReducer, initialTacticalState);
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [stages, setStages] = useState<StageRecord[]>([fallbackStage]);
  const [collectionStatus, setCollectionStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [skipped, setSkipped] = useState(0);
  const handleUnitReady = useCallback((requestId: number) => {
    dispatch({ type: 'unit-ready', requestId });
  }, []);
  const handleUnitError = useCallback((requestId: number) => {
    dispatch({ type: 'unit-error', requestId });
  }, []);

  useEffect(() => {
    let active = true;

    const loadResources = async () => {
      try {
        const result = await loadCollection('/collection.json');
        if (!active) return;
        setRecords(result.records);
        setSkipped(result.skipped);
        setCollectionStatus(result.records.length === 0 ? 'empty' : 'ready');
      } catch {
        if (active) setCollectionStatus('error');
      }

      try {
        const result = await loadStages('/stages.json');
        if (active) setStages(result);
      } catch {
        // The collection remains usable with the local hangar fallback.
      }
    };

    void loadResources();
    return () => {
      active = false;
    };
  }, []);

  const selectedUnit = records.find((record) => record.id === state.selectedUnitId) ?? null;
  const selectedStage = stages.find((stage) => stage.id === state.stageId) ?? stages[0];

  if (collectionStatus === 'loading') {
    return <main className="app-shell app-shell--status">Loading collection…</main>;
  }

  if (collectionStatus === 'error') {
    return <main className="app-shell app-shell--status">Collection unavailable</main>;
  }

  if (collectionStatus === 'empty') {
    return <main className="app-shell app-shell--status">No units available</main>;
  }

  return (
    <main className="app-shell" style={{ '--stage-background': selectedStage.background } as React.CSSProperties}>
      <section className="hero-display" aria-label="Hero display">
        <HeroCanvas
          unit={selectedUnit}
          stage={selectedStage}
          requestId={state.loadRequestId}
          onReady={handleUnitReady}
          onError={handleUnitError}
        />
        <div className="hero-display__content">
          <span className="eyebrow">TACTICAL SHOWCASE</span>
          <h1>Hero display</h1>
          {selectedUnit ? (
            <>
              <p className="hero-display__unit">{selectedUnit.title}</p>
              {state.unitStatus === 'error' && <p role="alert">Model unavailable</p>}
            </>
          ) : (
            <p>Select a unit from the roster to deploy it.</p>
          )}
        </div>
      </section>

      <CommandSheet
        records={records}
        skipped={skipped}
        selectedUnit={selectedUnit}
        selectedSlotId={state.selectedSlotId}
        stages={stages}
        selectedStageId={state.stageId}
        onSelectUnit={(unitId) => dispatch({ type: 'select-unit', unitId })}
        onSelectSlot={(slotId) => dispatch({ type: 'select-slot', slotId })}
        onSelectStage={(stageId) => dispatch({ type: 'select-stage', stageId })}
      />
    </main>
  );
}
