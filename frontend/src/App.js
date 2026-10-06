import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Landing from "@/pages/Landing";
import VideoPage from "@/pages/VideoPage";
import Admin from "@/pages/Admin";
import { PageTransitionProvider } from "@/components/PageTransition";
import { ContactModalProvider } from "@/context/ContactModalContext";
import ContactModal from "@/components/ContactModal";

function App() {
  return (
    <MotionConfig reducedMotion="never">
      <BrowserRouter>
        <ContactModalProvider>
          <PageTransitionProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/video" element={<VideoPage />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </PageTransitionProvider>
          <ContactModal />
        </ContactModalProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
