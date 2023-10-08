function Popup({ children, popupRef, openState }) {
  return (
    <>
      {openState && (
        <div className="overlay">
          <div className="popup" ref={popupRef}>
            {children}
          </div>
        </div>
      )}
    </>
  );
}

export default Popup;
