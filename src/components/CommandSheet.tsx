import { useState } from 'react';
import type { CollectionRecord } from '../app/types';

type CommandSheetProps = {
  records: CollectionRecord[];
  skipped: number;
  selectedUnit: CollectionRecord | null;
  onSelectUnit: (unitId: string) => void;
};

export function CommandSheet({ records, skipped, selectedUnit, onSelectUnit }: CommandSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="command-sheet" aria-label="Tactical command sheet">
      <div className="roster-list">
        <span className="eyebrow">ROSTER</span>
        <div className="unit-list">
          {records.map((record) => (
            <button
              className={`unit-card${selectedUnit?.id === record.id ? ' unit-card--selected' : ''}`}
              key={record.id}
              type="button"
              onClick={() => onSelectUnit(record.id)}
            >
              {record.title}
            </button>
          ))}
        </div>
        <p className="roster-list__count">{records.length} units</p>
        {skipped > 0 && <p className="notice">Some units were skipped: {skipped}</p>}
      </div>

      <div className="unit-select">
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Select unit"
          className="unit-select__button"
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          {selectedUnit?.title ?? 'Select a unit…'}
        </button>
        {open && (
          <ul className="unit-select__list" role="listbox" aria-label="Units">
            {records.map((record) => (
              <li
                aria-selected={selectedUnit?.id === record.id}
                className="unit-select__option"
                key={record.id}
                role="option"
                onClick={() => {
                  onSelectUnit(record.id);
                  setOpen(false);
                }}
              >
                {record.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
