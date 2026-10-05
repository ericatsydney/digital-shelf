import type { CollectionRecord, StageRecord } from '../app/types';

type CommandSheetProps = {
  records: CollectionRecord[];
  skipped: number;
  selectedUnit: CollectionRecord | null;
  stages: StageRecord[];
  selectedStageId: string;
  onSelectUnit: (unitId: string) => void;
  onSelectStage: (stageId: string) => void;
};

export function CommandSheet({
  records,
  skipped,
  selectedUnit,
  stages,
  selectedStageId,
  onSelectUnit,
  onSelectStage,
}: CommandSheetProps) {
  return (
    <section className="command-sheet" aria-label="Tactical command sheet">
      <div className="command-sheet__roster">
        <div className="section-heading">
          <span className="eyebrow">ROSTER</span>
          <span className="section-heading__count">{records.length} units</span>
        </div>
        {skipped > 0 && <p className="notice">Some units were skipped: {skipped}</p>}
        <div className="unit-list">
          {records.map((record) => (
            <button
              className={`unit-card${selectedUnit?.id === record.id ? ' unit-card--selected' : ''}`}
              key={record.id}
              type="button"
              onClick={() => onSelectUnit(record.id)}
            >
              <span className="unit-card__title">{record.title}</span>
              <span className="unit-card__category">{record.category}</span>
              {record.tags?.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </button>
          ))}
        </div>
      </div>

      <div className="command-sheet__controls">
        <div>
          <div className="section-heading"><span className="eyebrow">TACTICAL STAGE</span></div>
          <div className="stage-list">
            {stages.map((stage) => (
              <button
                aria-pressed={selectedStageId === stage.id}
                aria-label={`${stage.name} stage`}
                className="stage-button"
                key={stage.id}
                type="button"
                onClick={() => onSelectStage(stage.id)}
              >
                <span className="stage-swatch" style={{ backgroundColor: stage.accentColor }} />
                {stage.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
