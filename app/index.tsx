import { Redirect } from "expo-router";

// El _layout.tsx raíz ya redirige según la sesión (login o feed).
// Esta pantalla solo cubre la ruta "/" por si se accede directamente.
export default function Index() {
  return <Redirect href="/(tabs)/feed" />;
}
