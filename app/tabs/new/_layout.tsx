import { Stack } from 'expo-router/stack';

const _layout = () => {
    return (
        <Stack>
            <Stack.Screen name="SelectStore" options={{ title: "Store auswählen" }} />
            <Stack.Screen name="[storeId]" options={{ title: "Produkt auswählen" }} />
        </Stack>
    )
}

export default _layout