import { ITEMS, type Item } from "@mutator-party/shared";
import { ITEM_INFO } from "./constants";
import { Card, Row, Stepper, Toggle } from "./components";

interface CardFProps {
  itemsEnabled: boolean;
  allowedItems: Item[];
  itemSpots: number;
  firstTouch: boolean;
  keepOnKO: boolean;
  onItemsEnabledChange: (v: boolean) => void;
  onToggleItem: (it: Item) => void;
  onItemSpotsChange: (v: number) => void;
  onFirstTouchChange: (v: boolean) => void;
  onKeepOnKOChange: (v: boolean) => void;
}

export function CardF_Items({
  itemsEnabled,
  allowedItems,
  itemSpots,
  firstTouch,
  keepOnKO,
  onItemsEnabledChange,
  onToggleItem,
  onItemSpotsChange,
  onFirstTouchChange,
  onKeepOnKOChange,
}: CardFProps) {
  return (
    <Card badge="F" title="Power-ups">
      <Row label="Enable power-up crates">
        <Toggle checked={itemsEnabled} onChange={onItemsEnabledChange} />
      </Row>

      {itemsEnabled && (
        <>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              margin: "4px 0",
            }}
          >
            {ITEMS.map((it) => {
              const isSel = allowedItems.includes(it);
              const info = ITEM_INFO[it];
              return (
                <button
                  key={it}
                  type="button"
                  onClick={() => onToggleItem(it)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    border: "2px solid var(--mp-ink)",
                    background: isSel ? "var(--mp-mint)" : "var(--mp-paper)",
                    color: "var(--mp-ink)",
                    fontWeight: 900,
                    fontSize: "12px",
                    cursor: "pointer",
                    opacity: isSel ? 1 : 0.5,
                    boxShadow: isSel ? "1.5px 1.5px 0 var(--mp-ink)" : "none",
                  }}
                >
                  {info.icon} {info.name}
                </button>
              );
            })}
          </div>

          <Row label="Power spots per round">
            <Stepper
              value={itemSpots}
              min={1}
              max={5}
              onChange={onItemSpotsChange}
            />
          </Row>

          <Row label="First player to touch gets it">
            <Toggle checked={firstTouch} onChange={onFirstTouchChange} />
          </Row>

          <Row label="Keep item after knockout">
            <Toggle checked={keepOnKO} onChange={onKeepOnKOChange} />
          </Row>
        </>
      )}
    </Card>
  );
}

