import type { StageRecord } from '../app/types';

type StageSwitcherProps = {
  stages: StageRecord[];
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
};

const iconPaths: Record<StageRecord['backdrop']['variant'], string> = {
  hangar: 'M3 20V9l9-5 9 5v11M8 20v-7h8v7',
  forest: 'M12 3l5 7h-3l4 6h-5v5h-2v-5H6l4-6H7z',
  'ruined-city': 'M3 21V10h5v11M10 21V4h5v17M17 21v-8h4v8',
  space: 'M12 3l2.2 6.8H21l-5.5 4 2.1 6.7-5.6-4.1-5.6 4.1 2.1-6.7L3 9.8h6.8z',
};

export function StageSwitcher({ stages, selectedStageId, onSelectStage }: StageSwitcherProps) {
  return (
    <div className="stage-switcher" role="group" aria-label="Tactical stage">
      {stages.map((stage) => (
        <button
          aria-pressed={selectedStageId === stage.id}
          aria-label={`${stage.name} stage`}
          className="stage-icon-button"
          key={stage.id}
          style={{ '--stage-accent': stage.accentColor } as React.CSSProperties}
          title={stage.name}
          type="button"
          onClick={() => onSelectStage(stage.id)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path d={iconPaths[stage.backdrop.variant]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}
