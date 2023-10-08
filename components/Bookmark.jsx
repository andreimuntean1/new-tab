import Image from "next/image";
import Link from "next/link";

const Loader = () => {
  return <div style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: "#b8b8b8" }}></div>;
};

function Bookmark({ href, label, onContextMenu }) {
  return (
    <Link href={href.includes("http") ? href : `https://${href}`}>
      <a onContextMenu={onContextMenu}>
        <Image src={`https://www.google.com/s2/favicons?domain=${href}&sz=128`} alt={label} width={42} height={42} />
        <h5>{label}</h5>
      </a>
    </Link>
  );
}

export default Bookmark;
