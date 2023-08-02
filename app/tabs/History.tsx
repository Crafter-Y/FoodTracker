import { View, Text, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import useDatabase from '@/hooks/useDatabase';
import { ConsumedItem } from '@/entities/consumedItem';
import { AntDesign } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';

const History = () => {
    const { dataSource, isReady } = useDatabase();

    const [consumed, setConsumed] = useState<{
        dayPane: boolean,
        hourPane: boolean,
        fmt_date: string,
        entry: ConsumedItem
    }[]>([]);


    const fetchHistory = async () => {
        let consumedRepo = dataSource.getRepository(ConsumedItem);

        let history = await consumedRepo.find({
            order: { date: "DESC" }, relations: {
                product: {
                    store: true,
                }
            }
        })
        setConsumed(await getInformationalHistory(history));
    }

    const getInformationalHistory = async (locCon: ConsumedItem[]) => {
        let lastDay = ""
        let lastHour = -1
        if (locCon == null) return []

        return locCon.map(item => {
            let returner = {
                dayPane: false,
                hourPane: false,
                fmt_date: "",
                entry: item
            }

            let thisDate = item.date.getDate() + "." + item.date.getMonth() + "." + item.date.getFullYear();
            if (thisDate != lastDay) {
                returner.dayPane = true;
                returner.hourPane = true;
                lastDay = thisDate;
            }
            returner.fmt_date = thisDate

            if (item.date.getHours() != lastHour) {
                returner.hourPane = true;
                lastHour = item.date.getHours();
            }

            return returner;
        })
    }

    useEffect(() => {
        if (!isReady) return;

        fetchHistory()
    }, [isReady])

    return (
        <ScrollView>
            <Pressable className="border rounded-lg px-2 py-1 m-2 flex-row items-center" onPress={fetchHistory}>
                <AntDesign name="reload1" size={19} color="black" />
                <Text className="text-lg ml-2">Reload</Text>
            </Pressable>

            {consumed.map(entry => (
                <View key={entry.entry.consumedId}>
                    {entry.dayPane && (
                        <View className="bg-gray-300 h-10 justify-center px-4">
                            <Text className="text-xl font-semibold">{entry.fmt_date}</Text>
                        </View>
                    )}
                    {entry.hourPane && (
                        <Text className="text-lg">{entry.entry.date.getHours()} Uhr</Text>
                    )}
                    <View className="bg-gray-200 border-t border-b px-4 flex-row items-center">
                        <Ionicons name="images-sharp" size={96} color="black" />
                        <View className="ml-4">
                            <Text>{entry.entry.product.store?.name}</Text>
                            <Text className="text-lg">{entry.entry.product?.name}</Text>
                        </View>
                    </View>
                </View>
            ))}
        </ScrollView>
    )
}

export default History