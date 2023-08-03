import { Text, View, useWindowDimensions } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import useDatabase from '@/hooks/useDatabase';
import { ConsumedItem } from '@/entities/consumedItem';
import { MoreThan } from 'typeorm/browser';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import { Bar } from 'react-native-progress';
import { AppContext, AppContextType } from '@/helpers/AppContext';
import { PieChart } from 'react-native-gifted-charts';

const drinkMlSuggested = 2500

const sliceColors = ['#ff0000', '#ff2b00', '#ff8000', '#ffaa00', '#ffd500', '#ffff00', '#d5ff00', '#aaff00', '#80ff00', '#2bff00']

const Dashboard = () => {
    const { dataSource, isReady } = useDatabase();
    const { consumptionValid } = useContext(AppContext) as AppContextType;
    const { width } = useWindowDimensions();

    const [mlDrankToday, setMlDrunkToday] = useState(0)
    const [drankSaturation, setDrankSaturation] = useState(0.1) // progress bar
    const [drankSaturationColor, setDrankSaturationColor] = useState("#ff0000")

    const [moneySpentMonth, setMoneySpentMonth] = useState(0);

    const [todayPieData, setTodayPieData] = useState<PieChartData[]>([{ value: 1, color: "lightgray" }]);
    const [pieChartStatement, setPieChatStatement] = useState("");

    const [kcalToday, setKcalToday] = useState(0);
    const [fatToday, setFatToday] = useState(0);
    const [sugarToday, setSugarToday] = useState(0);
    const [proteinToday, setProteinToday] = useState(0);
    const [saltToday, setSaltToday] = useState(0);
    const [moneyToday, setMoneyToday] = useState(0);

    const setTodayStats = async () => {
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

        const pieData = []

        for (let i = 0; i <= 9; i++) {
            let dataPoint = {
                value: todayItems.filter(el => el.healthy > i && el.healthy <= i + 1).length,
                color: sliceColors[i]
            }
            if (i == 0) {
                dataPoint.value += todayItems.filter(el => el.healthy == 0).length
            }

            pieData.push(dataPoint)
        }
        setTodayPieData(pieData)

        let healthySum = todayItems.reduce((partialSum, a) => partialSum + a.healthy, 0);
        let healthyCount = todayItems.filter(el => el.healthy != null).length || 1
        let healthyAverage = healthySum / healthyCount;

        if (healthyAverage < 2) {
            setPieChatStatement("Ungesund")
        } else if (healthyAverage < 5) {
            setPieChatStatement("Überwiegend ungesund")
        } else if (healthyAverage < 7.5) {
            setPieChatStatement("Gesund")
        } else {
            setPieChatStatement("Sehr Gesund")
        }

        let kcalSum = todayItems.reduce((partialSum, a) => partialSum + a.kcal, 0);
        setKcalToday(kcalSum);
        let fatSum = todayItems.reduce((partialSum, a) => partialSum + a.fat, 0);
        setFatToday(fatSum)
        let sugarSum = todayItems.reduce((partialSum, a) => partialSum + a.sugar, 0);
        setSugarToday(sugarSum)
        let proteinSum = todayItems.reduce((partialSum, a) => partialSum + a.protein, 0);
        setProteinToday(proteinSum)
        let saltSum = todayItems.reduce((partialSum, a) => partialSum + a.sugar, 0);
        setSaltToday(saltSum)
        let moneySpent = todayItems.reduce((partialSum, a) => partialSum + a.price, 0);
        setMoneyToday(moneySpent)
    }

    const setMonthStats = async () => {
        let consumedRepo = dataSource.getRepository(ConsumedItem);

        let startMonth = new Date()
        startMonth.setUTCDate(1)
        startMonth.setHours(0)
        startMonth.setMinutes(0)
        startMonth.setSeconds(0)
        startMonth.setMilliseconds(0)

        let monthItems = await consumedRepo.find({ where: { date: MoreThan(startMonth) } })
        let moneySpent = monthItems.reduce((partialSum, a) => partialSum + a.price, 0);

        setMoneySpentMonth(moneySpent)
    }

    const fetchData = async () => {
        setTodayStats();
        setMonthStats()
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

            <View className="items-center mt-6">
                <PieChart
                    data={todayPieData}
                    donut={true}
                    centerLabelComponent={() => (
                        <View className='items-center'>
                            <Text>Ernährung:</Text>
                            <Text className='text-center'>{pieChartStatement}</Text>
                        </View>
                    )}
                />
            </View>

            <View className="flex-row flex-wrap mt-2">
                <View style={{ width: width / 2 }}>
                    <Text className="text-center">Geld ausgegeben: {moneyToday.toLocaleString("de", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</Text>
                </View>
                <View style={{ width: width / 2 }}>
                    <Text className="text-center">Kalorien: {kcalToday.toLocaleString("de", { maximumFractionDigits: 0 })}</Text>
                </View>
                <View style={{ width: width / 2 }}>
                    <Text className="text-center">Fett: {fatToday.toLocaleString("de", { maximumFractionDigits: 1 })}g</Text>
                </View>
                <View style={{ width: width / 2 }}>
                    <Text className="text-center">Zucker: {sugarToday.toLocaleString("de", { maximumFractionDigits: 1 })}g</Text>
                </View>
                <View style={{ width: width / 2 }}>
                    <Text className="text-center">Salz: {saltToday.toLocaleString("de", { maximumFractionDigits: 1 })}g</Text>
                </View>
                <View style={{ width: width / 2 }}>
                    <Text className="text-center">Eiweiß: {proteinToday.toLocaleString("de", { maximumFractionDigits: 1 })}g</Text>
                </View>
            </View>

            <View className="bg-gray-200 justify-center px-2 mt-4">
                <Text className="text-2xl my-2">Diesen Monat</Text>
            </View>

            <View className="px-2">
                <Text>Geld ausgegeben: {moneySpentMonth.toLocaleString("de", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</Text>
            </View>

        </ScrollView>
    )
}

export default Dashboard
