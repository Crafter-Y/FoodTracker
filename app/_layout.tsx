import { Tabs } from 'expo-router/tabs';
import { AntDesign } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from "../helpers/AppContext";
import "../global.css";
import { useState } from 'react';
import { DataSource } from 'typeorm/browser';
import { LogBox } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons';

LogBox.ignoreLogs([
  'Require cycle:'
])

const _layout = () => {
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [consumptionValid, setConsumptionValid] = useState(false);

  return (
    <AppContext.Provider value={{ dataSource, setDataSource, consumptionValid, setConsumptionValid }}>
      <Tabs>
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen
          name="tabs/Dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: () => (<AntDesign name="home" size={24} color="black" />)
          }}
        />
        <Tabs.Screen name="tabs/new" options={{
          title: "Neu",
          headerShown: false,
          tabBarIcon: () => (<Ionicons name="fast-food-outline" size={24} color="black" />)
        }}
        />
        <Tabs.Screen
          name="tabs/History"
          options={{
            title: "Verlauf",
            tabBarIcon: () => (<MaterialIcons name="history" size={24} color="black" />)
          }}
        />
      </Tabs>
    </AppContext.Provider>
  )
}

export default _layout