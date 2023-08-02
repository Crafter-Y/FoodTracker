import { Text, View, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import useDatabase from '@/hooks/useDatabase';
import { Store } from '@/entities/store';
import { FontAwesome5 } from '@expo/vector-icons';
import { Link } from 'expo-router';

const SelectStore = () => {
    const { dataSource, isReady } = useDatabase();
    const [stores, setStores] = useState<Store[]>([])

    const { width } = useWindowDimensions();

    useEffect(() => {
        if (!isReady) return;
        (async () => {
            let repo = dataSource.getRepository(Store);
            let allStores = await repo.find();
            setStores(allStores)
        })()
    }, [isReady])

    return (
        <View className="flex-row flex-wrap">
            {stores.map(store => (
                <Link key={store.storeId} href={{ pathname: "/tabs/new/[storeId]", params: { storeId: store.storeId } }} >
                    <View style={{ width: width / 2 }}>
                        <View className='flex-row items-center justify-between border rounded-md px-2 py-1 m-1 h-16'>
                            <FontAwesome5 name="store" size={24} color="black" />
                            <Text className='text-lg'>{store.name}</Text>
                        </View>
                    </View>
                </Link>
            ))}
        </View>
    )
}

export default SelectStore