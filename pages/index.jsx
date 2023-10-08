import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, getDocFromServer, getFirestore, setDoc, updateDoc } from "firebase/firestore";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu";
import { useDebounce } from "usehooks-ts";
import Bookmark from "../components/Bookmark";
import Popup from "../components/Popup";
import { app } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useClickOutside } from "../hooks/useClickOutside";
import Clock from "/components/Clock";
import DailyText from "/components/DailyText";
import Date from "/components/Date";
import Icon from "/components/Icon";

function App() {
  const [color, setColor] = useState("#272727");
  const debouncedColor = useDebounce(color, 500);
  const [colorName, setColorName] = useState("");
  const [textColor, setTextColor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [colorIsOpen, setColorIsOpen] = useState(false);
  const [addBookmarkIsOpen, setAddBookmarkIsOpen] = useState(false);
  const [modifiedBookmark, setModifiedBookmark] = useState({ isOpen: { edit: false, delete: false }, id: null, label: "", link: "" });
  const [loginIsOpen, setLoginIsOpen] = useState(false);
  const [link, setLink] = useState("");
  const [label, setLabel] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const [error, setError] = useState("");

  const colorPopup = useRef();
  const addBookmarkPopup = useRef();
  const editBookmarkPopup = useRef();
  const deleteBookmarkPopup = useRef();
  const loginPopup = useRef();

  const db = getFirestore(app);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const { user } = useAuth(auth);
  const router = useRouter();

  const urlExp = new RegExp(
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/
  );

  useClickOutside(colorPopup, () => {
    setColorIsOpen(false);
    setError("");
  });
  useClickOutside(addBookmarkPopup, () => {
    setAddBookmarkIsOpen(false);
    setError("");
  });
  useClickOutside(editBookmarkPopup, () => {
    setModifiedBookmark({ ...modifiedBookmark, isOpen: { ...modifiedBookmark.isOpen, edit: false } });
    setError("");
  });
  useClickOutside(deleteBookmarkPopup, () => {
    setModifiedBookmark({ ...modifiedBookmark, isOpen: { ...modifiedBookmark.isOpen, delete: false } });
    setError("");
  });

  const getData = useCallback(
    async (user) => {
      getDoc(doc(db, "users", user.uid)).then((doc) => {
        const { accentColor, bookmarks } = doc.data();
        setColor(accentColor);
        setBookmarks(bookmarks);
      });
    },
    [db]
  );

  const generateTextColor = (color) => {
    const r = parseInt(color.substring(1, 2), 16);
    const g = parseInt(color.substring(3, 2), 16);
    const b = parseInt(color.substring(5, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    yiq >= 128 ? setTextColor("#000000") : setTextColor("#ffffff");
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => (user ? getData(user) : setLoginIsOpen(true)));
    setIsLoading(false);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setColorIsOpen(false);
        setAddBookmarkIsOpen(false);
        setModifiedBookmark((modifiedBookmark) => ({ ...modifiedBookmark, isOpen: { edit: false, delete: false } }));
        setError("");
      }
    });
  }, [auth, getData]);

  useEffect(() => {
    const handleChange = async () => {
      generateTextColor(debouncedColor);
      getColorName(debouncedColor);
      user &&
        color !== "#272727" &&
        (await updateDoc(doc(db, "users", user.uid), {
          accentColor: debouncedColor,
        }));
    };

    handleChange();
  }, [color, db, debouncedColor, user]);

  const signIn = () => {
    signInWithPopup(auth, provider).then(async ({ user }) => {
      if (!(await getDoc(doc(db, "users", user.uid))).exists())
        await setDoc(doc(db, "users", user.uid), {
          accentColor: color,
          bookmarks: [],
        });
      setLoginIsOpen(false);
    });
  };

  const getColorName = async (color) => {
    await fetch(`https://www.thecolorapi.com/id?hex=${color.slice(1)}`)
      .then((res) => res.json())
      .then((data) => setColorName(data.name.value));
  };

  const handleChange = {
    color: (e) => setColor(e.target.value),
    link: {
      create: (e) => {
        setLink(e.target.value);
        setError("");
      },
      modify: (e) => {
        setModifiedBookmark({ ...modifiedBookmark, link: e.target.value });
        setError("");
      },
    },
    label: {
      create: (e) => {
        setLabel(e.target.value);
        setError("");
      },
      modify: (e) => {
        setModifiedBookmark({ ...modifiedBookmark, label: e.target.value });
        setError("");
      },
    },
  };

  const handleRightClick = (e, id) => {
    e.preventDefault();
    const { label, link } = bookmarks.find((v) => v.id === id);
    setModifiedBookmark({ ...modifiedBookmark, id, label, link });
  };

  const addBookmark = async () => {
    if (!link.length > 0) {
      setError("Nu ai introdus nici-un link");
      return;
    }
    if (!link.match(urlExp)) {
      setError("Acesta nu este un link valid");
      return;
    }
    if (!label.length > 0) {
      setError("Nu i-ai dat nici-un nume bookmark-ului tău");
      return;
    }

    await updateDoc(doc(db, "users", user.uid), {
      bookmarks: [...bookmarks, { link, label, id: bookmarks.length }],
    }).then(() => {
      getData(user);
      setAddBookmarkIsOpen(false);
    });
  };

  const handleEditBookmark = async () => {
    const currentlyEditingBookmark = (await getDocFromServer(doc(db, "users", user.uid))).data().bookmarks[modifiedBookmark.id];

    if (!modifiedBookmark.link.length > 0) {
      setError("Nu ai introdus nici-un link");
      return;
    }
    if (!modifiedBookmark.link.match(urlExp)) {
      setError("Acesta nu este un link valid");
      return;
    }
    if (!modifiedBookmark.label.length > 0) {
      setError("Nu i-ai dat nici-un nume bookmark-ului tău");
      return;
    }
    if (modifiedBookmark.label === currentlyEditingBookmark.label && modifiedBookmark.link === currentlyEditingBookmark.link) {
      setError("Nu ai modificat nimic");
      return;
    }

    await updateDoc(doc(db, "users", user.uid), {
      bookmarks: [
        ...bookmarks.filter((item) => item.id !== modifiedBookmark.id),
        { id: modifiedBookmark.id, label: modifiedBookmark.label, link: modifiedBookmark.link },
      ],
    }).then(() => {
      getData(user);
      setModifiedBookmark({ ...modifiedBookmark, isOpen: { ...modifiedBookmark.isOpen, edit: false } });
    });
  };

  const handleDeleteBookmark = async () => {
    await updateDoc(doc(db, "users", user.uid), { bookmarks: [...bookmarks.filter((item) => item.id !== modifiedBookmark.id)] }).then(() => {
      getData(user);
      setModifiedBookmark({ ...modifiedBookmark, isOpen: { ...modifiedBookmark.isOpen, delete: false } });
    });
  };

  // TODO: light mode

  return (
    <>
      <Head>
        <title>New tab</title>
        <link rel="shortcut icon" href="/edge_logo.png" type="image/png" />
      </Head>

      <>
        <Popup popupRef={colorPopup} openState={colorIsOpen}>
          <h3>Schimbă culoarea de accent a paginii</h3>
          <div className="color">
            <input type="color" value={color} onChange={(e) => handleChange.color(e)} />
            <p style={{ color }}>({colorName})</p>
          </div>
          <button className="logout" onClick={() => signOut(auth).then(() => router.reload())}>
            Deconectează-te
          </button>
        </Popup>

        <Popup popupRef={addBookmarkPopup} openState={addBookmarkIsOpen}>
          <h3>Adaugă un bookmark nou</h3>
          <form>
            <input type="url" onChange={handleChange.link.create} placeholder="Link" />
            <input type="text" onChange={handleChange.label.create} placeholder="Etichetă" />
          </form>
          <p className="error" style={{ marginTop: error.length > 0 ? "20px" : 0 }}>
            {error}
          </p>
          <button
            onClick={addBookmark}
            style={{ marginTop: error.length > 0 ? 0 : "20px", marginBottom: "10px", background: color, color: textColor }}
          >
            Salvează
          </button>
        </Popup>

        <Popup popupRef={editBookmarkPopup} openState={modifiedBookmark.isOpen.edit}>
          <h3>Editează {modifiedBookmark.label}</h3>
          <form>
            <input type="url" value={modifiedBookmark.link} onChange={handleChange.link.modify} placeholder="Link" />
            <input type="text" value={modifiedBookmark.label} onChange={handleChange.label.modify} placeholder="Etichetă" />
          </form>
          <p className="error" style={{ marginTop: error.length > 0 ? "20px" : 0, marginBottom: "10px" }}>
            {error}
          </p>
          <button onClick={handleEditBookmark} style={{ background: color, color: textColor }}>
            Salvează
          </button>
        </Popup>

        <Popup popupRef={deleteBookmarkPopup} openState={modifiedBookmark.isOpen.delete}>
          <h3>Ești sigur că vrei să ștergi {modifiedBookmark.label}?</h3>
          <div className="actions">
            <button onClick={() => setModifiedBookmark({ ...modifiedBookmark, isOpen: { ...modifiedBookmark.isOpen, delete: false } })}>
              Anulează
            </button>
            <button style={{ background: color, color: textColor }} onClick={handleDeleteBookmark}>
              Șterge
            </button>
          </div>
        </Popup>

        <Popup popupRef={loginPopup} openState={loginIsOpen}>
          <h3>Conectează-te</h3>
          <button className="loginButton" onClick={signIn}>
            <FontAwesomeIcon color="#fff" icon={faGoogle} style={{ width: 24, height: 24 }} />
            Conectează-te cu Google
          </button>
        </Popup>

        <ContextMenu id="ctxMenu">
          <MenuItem onClick={() => setModifiedBookmark({ ...modifiedBookmark, isOpen: { ...modifiedBookmark.isOpen, edit: true } })}>
            <Icon.Pencil />
            <div>Editează</div>
          </MenuItem>
          <MenuItem onClick={() => setModifiedBookmark({ ...modifiedBookmark, isOpen: { ...modifiedBookmark.isOpen, delete: true } })}>
            <Icon.Trash />
            <div>Șterge</div>
          </MenuItem>
        </ContextMenu>

        {isLoading && (
          <div className="loading">
            <span className="loader"></span>
          </div>
        )}

        <header>
          <Icon.Settings onClick={() => setColorIsOpen(true)} />
        </header>
        <main>
          <Clock />
          <Date />
          <div className="bookmarks">
            {bookmarks
              .sort((a, b) => a.id - b.id)
              .map(({ link, label, id }, idx) => (
                <ContextMenuTrigger id="ctxMenu" key={idx}>
                  <Bookmark href={link} label={label} onContextMenu={(e) => handleRightClick(e, id)} />
                </ContextMenuTrigger>
              ))}
            {bookmarks.length < 10 && (
              <div className="add" onClick={() => setAddBookmarkIsOpen(true)}>
                <div>
                  <Icon.Add />
                </div>
              </div>
            )}
          </div>
        </main>
        <footer>
          <DailyText />
        </footer>
        <div className="soft-blur" style={{ background: color || "transparent" }} />
      </>
    </>
  );
}

export default App;
