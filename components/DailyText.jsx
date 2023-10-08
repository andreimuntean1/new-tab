import { useEffect, useState } from "react";

function DailyText() {
  const [data, setData] = useState();

  useEffect(() => {
    const getText = async () =>
      fetch("https://daily-text-api.andreimuntean.dev?lang=ro")
        .then((res) => res.json())
        .then(({ text, verse, url }) => setData({ text, verse, url }));

    getText();
  }, []);

  return (
    data && (
      <h4>
        <a href={data.url} target="_blank" rel="noreferrer">
          {`${data.text} (${data.verse})`}
        </a>
      </h4>
    )
  );
}

export default DailyText;
