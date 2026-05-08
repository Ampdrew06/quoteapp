import { useEffect } from "react";
import AppRoutes from "./app/routes";
import { loadMaterialsFromCloud } from "./lib/materials";

export default function App() {
  useEffect(() => {
    async function syncMaterials() {
      const ok = await loadMaterialsFromCloud();

      console.log(
        ok
          ? "Global materials sync complete"
          : "Using cached local materials"
      );
    }

    syncMaterials();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncMaterials();
      }
    };

    window.addEventListener("focus", syncMaterials);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncMaterials);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <AppRoutes />;
}