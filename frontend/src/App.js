import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Landing from "@/pages/Landing";
import VideoPage from "@/pages/VideoPage";
import Admin from "@/pages/Admin";

function App() {
  return (
    <MotionConfig reducedMotion="never">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/video" element={<VideoPage />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
