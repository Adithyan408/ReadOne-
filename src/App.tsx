import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./Components/Home";
import Blog from "./Components/Blog";
import Login from "./Components/Login";

function App() {
  return(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/blog/:id" element={<Blog />}/>
    </Routes>
  </BrowserRouter>
  );
}

export default App;
