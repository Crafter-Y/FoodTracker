import { Tabs } from 'expo-router/tabs';
import { AntDesign } from '@expo/vector-icons';

import "../global.css";

const _layout = () => {
  return (
    <Tabs screenOptions={{headerShown: false}}>
      <Tabs.Screen name="index" options={{href: null}} />
      <Tabs.Screen
        name="tabs/Dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: () => (<AntDesign name="home" size={24} color="black" />)
        }}
      />
    </Tabs>
  )
}

export default _layout