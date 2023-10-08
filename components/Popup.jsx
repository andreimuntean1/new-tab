import { AnimatePresence, motion } from "framer-motion";
import { popupAnimation } from "../animations/popup";

function Popup({ children, popupRef, openState }) {
  return (
    <AnimatePresence>
      {openState && (
        <motion.div
          className="overlay"
          initial={popupAnimation.background.initial}
          exit={popupAnimation.background.initial}
          animate={popupAnimation.background.animate}
        >
          <motion.div
            className="popup"
            initial={popupAnimation.popup.initial}
            exit={popupAnimation.popup.initial}
            animate={popupAnimation.popup.animate}
            transition={popupAnimation.popup.transition}
            ref={popupRef}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Popup;
