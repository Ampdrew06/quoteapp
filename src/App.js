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
  }, []);

  return <AppRoutes />;
}
