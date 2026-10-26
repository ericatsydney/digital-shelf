import type { CollectionRecord } from '../app/types';

type CommandSheetProps = {
  records: CollectionRecord[];
  skipped: number;
  selectedUnit: CollectionRecord | null;
  onSelectUnit: (unitId: string) => void;
};

export function CommandSheet({ records, skipped, selectedUnit, onSelectUnit }: CommandSheetProps) {
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
    </section>
  );
}
