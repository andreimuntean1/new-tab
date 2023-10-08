import { useState } from "react";

export function useReRender() {
  const [value, setValue] = useState(0);
  return () => setValue(value + 1);
}
