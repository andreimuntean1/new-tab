import moment from "moment";
import "moment/locale/ro";
import { useState } from "react";

function Clock() {
  const [time, setTime] = useState("");

  setInterval(() => setTime(moment().format("HH:mm")), 500);

  return <h1>{time}</h1>;
}

export default Clock;
