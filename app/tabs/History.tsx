import { View, Text, useWindowDimensions, Pressable } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import useDatabase from '@/hooks/useDatabase';
import { ConsumedItem } from '@/entities/consumedItem';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system';
import { attrDesc, targetDir } from './new/[storeId]';
import { Image } from 'expo-image';
import { AppContext, AppContextType } from '@/helpers/AppContext';
import Modal, { ModalHandle } from '@/components/Modal';

const History = () => {
    const { dataSource, isReady } = useDatabase();
    const { consumptionValid, setConsumptionValid } = useContext(AppContext) as AppContextType;

    const pictureModal = useRef<ModalHandle>(null);
    const [imageModalUri, setImageModalUri] = useState("");
    const { height, width } = useWindowDimensions();

    const [consumed, setConsumed] = useState<{
        dayPane: boolean,
        hourPane: boolean,
        fmt_date: string,
        hasImage: boolean,
        imageBase64: string,
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
        let dir = await FileSystem.readDirectoryAsync(targetDir);

        let lastDay = ""
        let lastHour = -1
        if (locCon == null) return []

        let arr = [];

        for (let i = 0; i < locCon.length; i++) {
            const item = locCon[i];

            let returner = {
                dayPane: false,
                hourPane: false,
                hasImage: false,
                imageBase64: "",
                fmt_date: "",
                entry: item
            }

            let el = dir.filter(el => el.startsWith(item.consumedId + "-thumbnail"))[0]
            if (el) {
                returner.hasImage = true
                returner.imageBase64 = `${targetDir}${el}`

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

            arr.push(returner)
        }

        return arr;
    }

    useEffect(() => {
        if (!isReady) return;

        fetchHistory()
    }, [isReady])

    useEffect(() => {
        if (!isReady) return;
        if (consumptionValid) return;

        setConsumptionValid(true)
        fetchHistory()
    }, [consumptionValid])

    return (
        <ScrollView refreshControl={
            <RefreshControl refreshing={false} onRefresh={fetchHistory} />
        }>
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
                    <View className="bg-gray-200 border-t border-b pr-4 pl-2 flex-row">
                        {entry.hasImage ? (
                            <Pressable onPress={() => {
                                setImageModalUri(entry.imageBase64)
                                pictureModal.current.toggleModal()
                            }}>
                                <Image source={{ uri: entry.imageBase64 }} style={{ height: 96, width: 96 }} />
                            </Pressable>
                        ) : (<Ionicons name="images-sharp" size={96} color="black" />)}
                        <View className="ml-4 justify-center">
                            <Text>{entry.entry.product.store?.name}</Text>
                            <Text className="text-lg">{entry.entry.product?.name}</Text>
                        </View>
                        <View className="flex-grow items-end">
                            <View>
                                {Object.keys(attrDesc).filter(el => entry.entry[el] != null).map(el =>
                                    <Text key={el}>{attrDesc[el]}: {entry.entry[el]}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            ))}
            <Modal type='CENTER' ref={pictureModal}>
                <View className="items-center my-2">
                    <Image source={{ uri: imageModalUri }} style={{ height: Math.min(height, width) * 0.8, width: Math.min(height, width) * 0.8 }} />
                </View>

            </Modal>
        </ScrollView>
    )
}

export default History