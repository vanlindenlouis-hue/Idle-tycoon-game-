import { useEffect, useState } from "react";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";

function getPath() {
  return window.location.pathname;
}

export default function App() {
  const [path, setPath] = useState(getPath);

  useEffect(() => {
    const handlePopState = () => setPath(getPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (path.startsWith("/game-master")) {
    return <AdminPage initialTab="game-master" />;
  }

  if (path.startsWith("/admin")) {
    return <AdminPage />;
  }

  return <DashboardPage />;
}
