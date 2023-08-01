import { Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import useDatabase from '@/hooks/useDatabase'
import { Store } from '@/entities/store'

const Dashboard = () => {
    const { dataSource, isReady } = useDatabase();
    const [stores, setStores] = useState<Store[]>([])

    useEffect(() => {
        if (!isReady) return;
        (async () => {
            let repo = dataSource.getRepository(Store);
            let allStores = await repo.find();
            setStores(allStores)
        })()
    }, [isReady])

    return (
        <SafeAreaView>
            <Text className="text-red-500">Dashboard</Text>
            <Text>{JSON.stringify(stores)}</Text>
        </SafeAreaView>
    )
}

export default Dashboard
