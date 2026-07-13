import { animate, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { formatMoney } from "../utils/format";

export function MoneyCounter({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const motionValue = useMotionValue(value);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsubscribe = motionValue.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [motionValue, value]);

  return (
    <span className={`number-tabular whitespace-nowrap ${className}`}>
      {formatMoney(displayValue)}
    </span>
  );
}
