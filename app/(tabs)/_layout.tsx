import { Tabs } from "expo-router";
import { View } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHouse, faMagnifyingGlass, faPlus, faComments, faUser } from "@fortawesome/free-solid-svg-icons";
import { C } from "../../src/theme";

function TabIcon({ icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <FontAwesomeIcon
        icon={icon}
        size={20}
        color={focused ? C.PRIMARY : C.TEXT_LIGHT}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.PRIMARY,
        tabBarInactiveTintColor: C.TEXT_LIGHT,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: C.SURFACE },
        headerTitleStyle: { color: C.TEXT, fontWeight: "700", fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: C.SURFACE,
          borderTopColor: C.BORDER,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => <TabIcon icon={faHouse} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Buscar",
          tabBarIcon: ({ focused }) => <TabIcon icon={faMagnifyingGlass} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Crear",
          tabBarIcon: ({ focused }) => <TabIcon icon={faPlus} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Mensajes",
          tabBarIcon: ({ focused }) => <TabIcon icon={faComments} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <TabIcon icon={faUser} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
