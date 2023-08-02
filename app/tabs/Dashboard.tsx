import { Text, View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import useDatabase from '@/hooks/useDatabase';
import { ConsumedItem } from '@/entities/consumedItem';
import { MoreThan } from 'typeorm/browser';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import { Bar } from 'react-native-progress';
import { AppContext, AppContextType } from '@/helpers/AppContext';

const drinkMlSuggested = 2500

const Dashboard = () => {
    const { dataSource, isReady } = useDatabase();
    const { consumptionValid } = useContext(AppContext) as AppContextType;

    const [mlDrankToday, setMlDrunkToday] = useState(0)
    const [drankSaturation, setDrankSaturation] = useState(0.1) // progress bar
    const [drankSaturationColor, setDrankSaturationColor] = useState("#ff0000")

    const [moneySpent, setMoneySpent] = useState(0);

    const fetchData = async () => {
        let consumedRepo = dataSource.getRepository(ConsumedItem);

        let startToday = new Date()
        startToday.setHours(0)
        startToday.setMinutes(0)
        startToday.setSeconds(0)
        startToday.setMilliseconds(0)

        let todayItems = await consumedRepo.find({ where: { date: MoreThan(startToday) } })

        let mlDrank = todayItems.reduce((partialSum, a) => partialSum + a.liquidMl, 0);
        setMlDrunkToday(mlDrank)
        if (mlDrank > drinkMlSuggested) {
            setDrankSaturation(100)
        } else {
            setDrankSaturation(mlDrank / drinkMlSuggested)
        }

        if (mlDrank > drinkMlSuggested * 0.5) {
            setDrankSaturationColor("#ffff00")
        }
        if (mlDrank > drinkMlSuggested * 0.85) {
            setDrankSaturationColor("#00ff00")
        }

        let startMonth = new Date()
        startMonth.setUTCDate(1)
        startMonth.setHours(0)
        startMonth.setMinutes(0)
        startMonth.setSeconds(0)
        startMonth.setMilliseconds(0)

        let monthItems = await consumedRepo.find({ where: { date: MoreThan(startMonth) } })
        let moneySpent = monthItems.reduce((partialSum, a) => partialSum + a.price, 0);

        setMoneySpent(moneySpent)
    }

    useEffect(() => {
        if (!isReady) return;

        fetchData()
    }, [isReady])

    useEffect(() => {
        if (!isReady) return;

        fetchData()
    }, [consumptionValid])

    return (
        <ScrollView refreshControl={
            <RefreshControl refreshing={false} onRefresh={fetchData} />
        }>
            <View className="bg-gray-200 justify-center px-2">
                <Text className="text-2xl my-2">Heute</Text>
            </View>

            <View className="px-2">
                <Text>Flüssigkeit</Text>
                <Text className='text-right'>{(mlDrankToday / 1000).toLocaleString("de", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}l / {(drinkMlSuggested / 1000).toLocaleString("de", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}l</Text>
                <Bar progress={drankSaturation} color={drankSaturationColor} width={null} unfilledColor="#e4e4e4" borderWidth={0} />
            </View>

            <View className="bg-gray-200 justify-center px-2 mt-10">
                <Text className="text-2xl my-2">Diesen Monat</Text>
            </View>

            <View className="px-2">
                <Text>Geld ausgegeben: {moneySpent.toLocaleString("de", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</Text>
            </View>

        </ScrollView>
    )
}

export default Dashboard
