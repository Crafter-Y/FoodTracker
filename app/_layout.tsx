import { Tabs } from 'expo-router/tabs';
import { AntDesign } from '@expo/vector-icons';
import { AppContext } from "../helpers/AppContext";
import "../global.css";
import { useState } from 'react';
import { DataSource } from 'typeorm/browser';

const _layout = () => {
  const [dataSource, setDataSource] = useState<DataSource | null>(null);

  return (
    <AppContext.Provider value={{ dataSource: dataSource, setDataSource }}>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen
          name="tabs/Dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: () => (<AntDesign name="home" size={24} color="black" />)
          }}
        />
      </Tabs>
    </AppContext.Provider>
  )
}

export default _layout