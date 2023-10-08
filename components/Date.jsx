import moment from "moment";
import "moment/locale/ro";
import { useState } from "react";

function Date() {
  const [date, setDate] = useState("");

  setInterval(() => setDate(moment().format("dddd, MM MMMM")), 1000);

  return <h3>{date}</h3>;
}

export default Date;
