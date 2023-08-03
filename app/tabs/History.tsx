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
import { AntDesign } from '@expo/vector-icons';
import { StoredImage } from '@/entities/storedImage';

const History = () => {
    const { dataSource, isReady } = useDatabase();
    const { consumptionValid, setConsumptionValid } = useContext(AppContext) as AppContextType;

    const pictureModal = useRef<ModalHandle>(null);
    const [imageModalUri, setImageModalUri] = useState("");
    const { height, width } = useWindowDimensions();

    type HistoryItem = {
        dayPane: boolean,
        hourPane: boolean,
        fmt_date: string,
        hasImage: boolean,
        imageUri: string,
        entry: ConsumedItem
    }

    const [consumed, setConsumed] = useState<HistoryItem[]>([]);

    const contextModal = useRef<ModalHandle>(null);
    const [contextItem, setContextItem] = useState<HistoryItem>(null)

    const fetchHistory = async () => {
        let consumedRepo = dataSource.getRepository(ConsumedItem);

        let history = await consumedRepo.find({
            order: { date: "DESC" }, relations: {
                product: {
                    store: true,
                },
                image: {
                    items: true
                }
            }
        })
        setConsumed(await getInformationalHistory(history));
    }

    const getInformationalHistory = async (locCon: ConsumedItem[]) => {
        const dirInfo = await FileSystem.getInfoAsync(targetDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
        }

        let dir = await FileSystem.readDirectoryAsync(targetDir);

        let lastDay = ""
        let lastHour = -1
        if (locCon == null) return []

        let arr = [];

        for (let i = 0; i < locCon.length; i++) {
            const item = locCon[i];

            let returner: HistoryItem = {
                dayPane: false,
                hourPane: false,
                hasImage: false,
                imageUri: "",
                fmt_date: "",
                entry: item
            }
            if (item.image) {
                let el = dir.filter(el => el.startsWith(item.image.imageId + "-thumbnail"))[0]
                if (el) {
                    returner.hasImage = true
                    returner.imageUri = `${targetDir}${el}`
                }
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

    const deleteHistoryEntry = async (entry: HistoryItem) => {
        let dir = await FileSystem.readDirectoryAsync(targetDir);

        let imageRepo = dataSource.getRepository(StoredImage)
        let consumedRepo = dataSource.getRepository(ConsumedItem);

        await consumedRepo.delete({ consumedId: entry.entry.consumedId })

        if (entry.entry.image && entry.entry.image.items && entry.entry.image.items.length == 1) {
            let imageId = entry.entry.image.imageId;
            await imageRepo.delete(imageId);

            let el = dir.filter(el => el.startsWith(imageId + "-thumbnail"))[0]
            if (el) await FileSystem.deleteAsync(`${targetDir}${el}`)
        }

        fetchHistory()
        contextModal.current.toggleModal()
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
                    <Pressable className="bg-gray-200 border-t border-b pr-4 pl-2 flex-row" onPress={() => {
                        setContextItem(entry)
                        contextModal.current.toggleModal();
                    }}>
                        {entry.hasImage ? (
                            <Pressable onPress={() => {
                                setImageModalUri(entry.imageUri)
                                pictureModal.current.toggleModal()
                            }}>
                                <Image source={{ uri: entry.imageUri }} style={{ height: 96, width: 96 }} />
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
                    </Pressable>
                </View>
            ))}
            <Modal type='CENTER' ref={pictureModal}>
                <View className="items-center my-2">
                    <Image source={{ uri: imageModalUri }} style={{ height: Math.min(height, width) * 0.8, width: Math.min(height, width) * 0.8 }} />
                </View>
            </Modal>

            <Modal type='CENTER' ref={contextModal}>
                <Text className="text-2xl text-center font-semibold mt-2 mb-4">{contextItem?.entry.product.name} - {contextItem?.fmt_date} {contextItem?.entry.date.getHours()} Uhr</Text>
                <Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => deleteHistoryEntry(contextItem)}>
                    <AntDesign name="delete" size={24} color="black" />
                    <Text className='text-2xl ml-4'>Produkt löschen</Text>
                </Pressable>
            </Modal>
        </ScrollView>
    )
}

export default History