import { FixedSizeList, type ListChildComponentProps } from "react-window";
import TransactionRow from "./TransactionRow";
import { type Transaction } from "../types";

export default function TransactionList({ items }: { items: Transaction[] }) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return (
      <div style={style}>
        <TransactionRow tx={item} />
      </div>
    );
  };

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={56}
      width={"100%"}
    >
      {Row}
    </FixedSizeList>
  );
}