import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import Modal, { ModalHandle } from '@/components/Modal';
import useDatabase from '@/hooks/useDatabase';
import { Product } from '@/entities/product';
import { Store } from '@/entities/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { ConsumedItem } from '@/entities/consumedItem';
import { Camera, CameraCapturedPicture } from 'expo-camera'
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { AppContext, AppContextType } from '@/helpers/AppContext';
import { Entypo } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';
import { StoredImage } from '@/entities/storedImage';

export const targetDir = FileSystem.documentDirectory + 'foodtracker/';

export const attrDesc = {
    kcal: "Kalorien",
    healthy: "Gesund (0-10)",
    liquidMl: "Flüssigkeit (ml)",
    price: "Preis (€)",
    fat: "Fett (g)",
    sugar: "Zucker (g)",
    protein: "Eisweiß (g)",
    salt: "Salz (g)",
}

type Attributes = {
    kcal?: number;
    healthy?: number;
    liquidMl?: number;
    price?: number;
    fat?: number;
    sugar?: number;
    protein?: number;
    salt?: number;
}

const storeId = () => {
    const { storeId } = useLocalSearchParams();
    const { dataSource, isReady } = useDatabase();
    const { setConsumptionValid } = useContext(AppContext) as AppContextType;

    const [products, setProducts] = useState<Product[]>([]);
    const [productUris, setProductUris] = useState<{ productId: number, uri: string }[]>([]);

    const [permission, requestPermission] = Camera.useCameraPermissions();

    const { height, width } = useWindowDimensions();

    const [search, setSearch] = useState("")

    const createModal = useRef<ModalHandle>(null);
    const [newProductName, setNewProductName] = useState("")
    const [createAttributes, setCreateAttributes] = useState<{
        attribute: keyof Attributes,
        value: number
    }[]>([])
    const [createAttributesText, setCreateAttributesText] = useState<
        {
            [key in keyof Attributes]: string
        }>({})

    const attributeModal = useRef<ModalHandle>(null);

    const selectModal = useRef<ModalHandle>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product>();
    const [consumeAttributes, setConsumeAttributes] = useState<{
        attribute: keyof Attributes,
        value: number
    }[]>([])
    const [consumeAttributesText, setConsumeAttributesText] = useState<
        {
            [key in keyof Attributes]: string
        }>({})

    const contextModal = useRef<ModalHandle>(null);
    const [contextProduct, setContextProduct] = useState<Product>();

    const cameraModal = useRef<ModalHandle>(null);
    const camera = useRef<Camera>(null)
    const [image, setImage] = useState<CameraCapturedPicture>()

    const selectImageModal = useRef<ModalHandle>(null);
    const [selectImageUris, setSelectImageUris] = useState<string[]>([])
    const [selectedImageUri, setSelectedImageUri] = useState<string>(null)

    const createProduct = async () => {
        if (!isReady) return;

        let storeRepo = dataSource.getRepository(Store);

        let store = await storeRepo.findOne({ where: { storeId: Number(storeId) } })
        if (store == null) return;

        let productRepo = dataSource.getRepository(Product);

        let product = new Product();
        product.store = store
        product.name = newProductName

        createAttributes.forEach(attr => {
            product[attr.attribute] = attr.value;
        })

        await productRepo.save(product)

        fetchProducts()

        createModal.current.toggleModal()
    }

    const consumeProduct = async () => {
        if (!isReady) return;

        let consumeRepo = dataSource.getRepository(ConsumedItem);

        let item = new ConsumedItem();

        item.product = selectedProduct
        consumeAttributes.forEach(attr => {
            item[attr.attribute] = attr.value;
        })

        await consumeRepo.save(item);

        let lastItem = await consumeRepo.findOne({
            where: { product: { productId: selectedProduct.productId } },
            order: { consumedId: 'DESC' }
        })

        if (lastItem == null) {
            console.log("image could not be saved")
        } else {
            await savePicture(lastItem)
            await assignSelectedImage(lastItem)
        }

        fetchProducts()
        setConsumptionValid(false)

        selectModal.current.toggleModal();
    }

    const fetchProducts = async () => {
        let productRepo = dataSource.getRepository(Product);
        let stId = Number(storeId);
        let allProducts = await productRepo.find({
            where: {
                store: {
                    storeId: stId
                }
            },
            relations: { consumedItems: { image: true } }
        })

        await fillImages(allProducts);

        setProducts(allProducts)
    }

    const startCamera = async () => {
        const perm = await requestPermission()
        if (!perm.granted) {
            console.log("camera permission failed")
            return;
        }
        cameraModal.current.toggleModal();
    }

    const takePicture = async () => {
        const photo = await camera.current.takePictureAsync({ base64: true });

        setImage(photo)
        cameraModal.current.toggleModal();
    }

    const savePicture = async (item: ConsumedItem) => {
        if (!image) return;

        const dirInfo = await FileSystem.getInfoAsync(targetDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
        }

        let imageEntry = new StoredImage();
        imageEntry.items = [item]

        let imageRepo = dataSource.getRepository(StoredImage);
        await imageRepo.save(imageEntry)

        let lastImageEntry = await imageRepo.findOne({ where: { items: { consumedId: item.consumedId } } })
        if (lastImageEntry == null) {
            throw new Error("newly inserted image not found")
        }

        //console.log(`Saving Picture ID:${lastImageEntry.imageId} for item ID:${item.consumedId}`)

        let ending = image.uri.split(".")[image.uri.split(".").length - 1]
        const fileUri = `${targetDir}${lastImageEntry.imageId}-thumbnail.${ending}`;

        await FileSystem.writeAsStringAsync(fileUri, image.base64, { encoding: FileSystem.EncodingType.Base64 })
    }

    const assignSelectedImage = async (item: ConsumedItem) => {
        if (!selectedImageUri) return;

        let imageRepo = dataSource.getRepository(StoredImage);

        let imageId = selectedImageUri.split("/")[selectedImageUri.split("/").length - 1].split("-")[0]

        let imageEntry = await imageRepo.findOne({
            where: { imageId: Number(imageId) },
            relations: { items: true }
        })
        if (imageEntry == null) {
            throw new Error(`Image (ID: ${imageId}) does exist in Database but not in Storage`)
        }
        if (imageEntry.items) {
            imageEntry.items.push(item)
        } else {
            console.log("replacing list")
            imageEntry.items = [item]
        }
        await imageRepo.save(imageEntry)
    }

    const fillImages = async (products: Product[]) => {
        let arr = []

        const dirInfo = await FileSystem.getInfoAsync(targetDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
        }

        let dir = await FileSystem.readDirectoryAsync(targetDir);
        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            let consumed = product.consumedItems;
            if (consumed.length == 0) continue;
            consumed.sort((a, b) => a.consumedId < b.consumedId ? 1 : -1)

            for (let j = 0; j < consumed.length; j++) {
                const item = consumed[j];

                if (item.image) {
                    let el = dir.filter(el => el.startsWith(item.image.imageId + "-thumbnail"))[0]
                    if (el) {
                        arr.push({
                            productId: product.productId,
                            uri: `${targetDir}${el}`
                        })
                        break;
                    }
                }
            }
        }

        setProductUris(arr);
    }

    const getProductImage = (productId: number) => {
        let productsMatching = productUris.filter(prod => prod.productId == productId);
        if (productsMatching.length > 0) {
            return productsMatching[0]
        }
        return null;
    }

    const deleteProduct = async (product: Product) => {
        if (!isReady) return;

        let consumeRepo = dataSource.getRepository(ConsumedItem);
        let imageRepo = dataSource.getRepository(StoredImage);

        for (let i = 0; i < product.consumedItems.length; i++) {
            const consumed = product.consumedItems[i];
            await consumeRepo.delete({ consumedId: consumed.consumedId })
            if (consumed.image) {
                await imageRepo.delete(consumed.image.imageId)
            }
        }

        let productRepo = dataSource.getRepository(Product);
        await productRepo.delete({ productId: product.productId })

        setConsumptionValid(false)
        fetchProducts();

        contextModal.current.toggleModal()
    }

    const addAttr = (value: keyof Attributes) => {
        createAttributesText[value] = "0"
        let cpy = JSON.parse(JSON.stringify(createAttributes));
        cpy.push({
            attribute: value,
            value: 0
        })
        setCreateAttributes(cpy)
    }

    const setAttr = (attribute: keyof Attributes, value: string) => {
        createAttributesText[attribute] = value
        let cpy = JSON.parse(JSON.stringify(createAttributes));
        cpy.filter(el => el.attribute == attribute)[0].value = Number(value)
        setCreateAttributes(cpy)
    }

    const initializeConsumeAttr = (product: Product) => {
        let newConsume = [];
        let newConsumeText = {};

        Object.keys(attrDesc).filter(el => product[el] != null).forEach(el => {
            let attribute = el as keyof Attributes;
            let value = product[el];

            newConsumeText[attribute] = value + ""

            newConsume.push({
                attribute,
                value: Number(value)
            })
        })
        setConsumeAttributes(newConsume)
        setConsumeAttributesText(newConsumeText)
    }

    const setConsumeAttr = (attribute: keyof Attributes, value: string) => {
        consumeAttributesText[attribute] = value
        let cpy = JSON.parse(JSON.stringify(consumeAttributes));
        cpy.filter(el => el.attribute == attribute)[0].value = Number(value)
        setConsumeAttributes(cpy)
    }

    const searchFunc = (pred: Product): boolean => {
        if (search.length == 0) return true;

        let searchTerms = search.toLowerCase().split(" ");

        let productTerms = pred.name.toLowerCase().split(" ")

        let score = 0;
        searchTerms.forEach(searchTerm => {
            let matching = productTerms.filter(productTerm => productTerm.includes(searchTerm)).length
            score += matching;
        })

        return score > 0;
    }

    const prepareSelectImage = async (product: Product) => {
        let consumedRepo = dataSource.getRepository(ConsumedItem);

        let dir = await FileSystem.readDirectoryAsync(targetDir);

        let consumed = await consumedRepo.find({
            where: { product: { productId: product.productId } },
            relations: { image: true }
        })

        let imageIds = []
        let imageUris = []

        consumed.forEach(consume => {
            if (consume.image && !imageIds.includes(consume.image.imageId)) {
                imageIds.push(consume.image.imageId)
                let el = dir.filter(el => el.startsWith(consume.image.imageId + "-thumbnail"))[0]

                if (el) imageUris.push(`${targetDir}${el}`)
            }
        })

        setSelectImageUris(imageUris)

        selectImageModal.current.toggleModal()
    }

    useEffect(() => {
        if (!isReady) return;

        fetchProducts();
    }, [isReady])

    return (
        <ScrollView>
            <Pressable className="border m-2 mx-2 rounded-lg h-12 flex-row items-center px-2" onPress={() => {
                setCreateAttributes([]);
                setCreateAttributesText({})
                setNewProductName("")
                createModal.current.toggleModal()
            }}>
                <AntDesign name="pluscircle" size={24} color="black" />
                <Text className='text-2xl ml-4'>Produkt hinzufügen</Text>
            </Pressable>

            <Modal type='CENTER' ref={createModal}>
                <Text className='text-2xl font-semibold mt-1 text-center'>Produkt erstellen</Text>

                <Text className='px-2'>Name</Text>
                <TextInput className="border rounded-lg text-lg mx-2 px-2" placeholder='Name des Produkts' value={newProductName} onChangeText={setNewProductName} />

                {createAttributes.map(entry =>
                    <View key={entry.attribute}>
                        <Text className='px-2 mt-4'>{attrDesc[entry.attribute]}</Text>
                        <TextInput className="border rounded-lg text-lg mx-2 px-2" placeholder={attrDesc[entry.attribute]} value={createAttributesText[entry.attribute]} onChangeText={value => {
                            setAttr(entry.attribute, value)
                        }} inputMode='numeric' />
                    </View>
                )}

                {createAttributes.length != Object.keys(attrDesc).length && (
                    <Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => attributeModal.current.toggleModal()}>
                        <Entypo name="add-to-list" size={16} color="black" />
                        <Text className='text-2xl ml-4'>Eigenschaft hinzufügen</Text>
                    </Pressable>
                )}


                <Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => createProduct()}>
                    <AntDesign name="pluscircle" size={16} color="black" />
                    <Text className='text-2xl ml-4'>Produkt erstellen</Text>
                </Pressable>
            </Modal>

            <View className="flex-row mx-2 mt-1">
                <TextInput className="border-b text-xl flex-grow" placeholder='Suche' returnKeyType='search' value={search} onChangeText={setSearch} />
                <AntDesign name="search1" size={24} color="black" />
            </View>

            {
                products.filter(searchFunc).map(product => (
                    <Pressable key={product.productId} className="border rounded-lg h-16 mx-2 flex-row justify-between items-center px-2 my-1" onPress={() => {
                        setSelectedProduct(product);

                        initializeConsumeAttr(product)

                        setImage(null)
                        setSelectedImageUri(null)
                        selectModal.current.toggleModal()
                    }}>
                        {getProductImage(product.productId) ?
                            (<Image source={{ uri: getProductImage(product.productId).uri }} style={{ height: 32, width: 32 }} />)
                            : <Ionicons name="images-sharp" size={24} color="black" />
                        }

                        <Text>{product.name}</Text>
                        <Pressable className="p-1" onPress={() => {
                            setContextProduct(product)
                            contextModal.current.toggleModal()
                        }}>
                            <MaterialCommunityIcons name="dots-vertical" size={24} color="black" />
                        </Pressable>

                    </Pressable>
                ))
            }

            <Modal type='CENTER' ref={attributeModal}>
                <Text className="text-2xl text-center font-semibold mt-2 mb-4">Eigenschaft hinzufügen</Text>
                {Object.keys(attrDesc).filter(el => createAttributes.filter(attr => attr.attribute == el).length == 0).map(el => (
                    <Pressable key={el} className="border my-1 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => {
                        addAttr(el as keyof Attributes)
                        attributeModal.current.toggleModal()
                    }}>
                        <AntDesign name="pluscircle" size={16} color="black" />
                        <Text className='text-2xl ml-4'>{attrDesc[el]}</Text>
                    </Pressable>
                ))}
            </Modal>

            <Modal type='CENTER' ref={contextModal}>
                <Text className="text-2xl text-center font-semibold mt-2 mb-4">{contextProduct?.name}</Text>
                <Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => deleteProduct(contextProduct)}>
                    <AntDesign name="delete" size={24} color="black" />
                    <Text className='text-2xl ml-4'>Produkt löschen</Text>
                </Pressable>
            </Modal>

            <Modal type='CENTER' ref={selectModal}>
                <Text className='text-2xl font-semibold mt-1 text-center'>{selectedProduct?.name}</Text>

                {selectedProduct && Object.keys(attrDesc).filter(el => selectedProduct[el] != null).map(el =>
                    <View key={el}>
                        <Text className='px-2 mt-4'>{attrDesc[el]}</Text>
                        <TextInput className="border rounded-lg text-lg mx-2 px-2" placeholder={attrDesc[el]} value={consumeAttributesText[el]} onChangeText={value => {
                            setConsumeAttr(el as keyof Attributes, value)
                        }} inputMode='numeric' />
                    </View>
                )}

                {!image && !selectedImageUri && (<Pressable className="border mt-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={startCamera}>
                    <AntDesign name="camerao" size={24} color="black" />
                    <Text className='text-2xl ml-4'>Foto hinzufügen</Text>
                </Pressable>)}

                {!image && !selectedImageUri && (<Pressable className="border mb-4 mt-2 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => prepareSelectImage(selectedProduct)}>
                    <MaterialCommunityIcons name="view-gallery-outline" size={24} color="black" />
                    <Text className='text-2xl ml-4'>Foto auswählen</Text>
                </Pressable>)}

                <Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={consumeProduct}>
                    <AntDesign name="pluscircle" size={16} color="black" />
                    <Text className='text-2xl ml-4'>Konsumieren</Text>
                </Pressable>
            </Modal>

            <Modal type='CENTER' ref={cameraModal}>
                <Text className="text-center text-2xl font-semibold mt-2">Foto aufnehmen</Text>
                <View className="items-center mt-2">
                    <Camera style={{ width: Math.min(height, width) * 0.8, height: Math.min(height, width) * 0.8 }} ref={camera} />
                </View>

                <View className="items-center my-2">
                    <Pressable className="border rounded-full p-1" onPress={takePicture}>
                        <MaterialCommunityIcons name="camera-iris" size={72} color="black" />
                    </Pressable>
                </View>
            </Modal>

            <Modal type='CENTER' ref={selectImageModal}>
                <Text className="text-center text-2xl font-semibold mt-2">Foto auswählen</Text>

                {selectImageUris?.length == 0 && (
                    <Text>Keine Bilder vorhanden</Text>
                )}

                <View className='flex-row flex-wrap justify-between px-2'>
                    {selectImageUris?.map(uri => (
                        <Pressable key={uri} onPress={() => {
                            setSelectedImageUri(uri)
                            selectImageModal.current.toggleModal()
                        }}>
                            <Image source={{ uri }} style={{ width: Math.min(height, width) * 0.28, height: Math.min(height, width) * 0.28 }} className='my-1' />
                        </Pressable>
                    ))}
                </View>

            </Modal>
        </ScrollView>
    )
}

export default storeId