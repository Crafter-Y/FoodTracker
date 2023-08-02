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

    const cameraModal = useRef<ModalHandle>(null);
    const camera = useRef<Camera>(null)
    const [image, setImage] = useState<CameraCapturedPicture>()

    const contextModal = useRef<ModalHandle>(null);
    const [contextProduct, setContextProduct] = useState<Product>();

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

        let lastItem = await consumeRepo.findOne({ where: { product: { productId: selectedProduct.productId } }, order: { consumedId: 'DESC' } })

        if (lastItem == null) {
            console.log("image could not be saved")
        } else {
            savePicture(lastItem.consumedId)
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
            relations: ["consumedItems"]
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

    const savePicture = async (id: number) => {
        if (!image) return;

        const dirInfo = await FileSystem.getInfoAsync(targetDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
        }

        let ending = image.uri.split(".")[image.uri.split(".").length - 1]
        const fileUri = `${targetDir}${id}-thumbnail.${ending}`;

        await FileSystem.writeAsStringAsync(fileUri, image.base64, { encoding: FileSystem.EncodingType.Base64 })
    }

    const fillImages = async (products: Product[]) => {
        let arr = []

        let dir = await FileSystem.readDirectoryAsync(targetDir);

        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            if (product == null) continue;

            let consumed = product.consumedItems;
            if (consumed.length == 0) continue;
            consumed.sort((a, b) => a.consumedId < b.consumedId ? 1 : -1)

            consumed.forEach(el2 => {
                let el = dir.filter(el => el.startsWith(el2.consumedId + "-thumbnail"))[0]
                if (el) arr.push({
                    productId: product.productId,
                    uri: `${targetDir}${el}`
                })
            })

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

        for (let i = 0; i < product.consumedItems.length; i++) {
            const consumed = product.consumedItems[i];
            await consumeRepo.delete({ consumedId: consumed.consumedId })
        }

        let productRepo = dataSource.getRepository(Product);
        await productRepo.delete({ productId: product.productId })

        fetchProducts();
        setConsumptionValid(false)

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

    useEffect(() => {
        if (!isReady) return;

        fetchProducts();
    }, [isReady])

    return (
        <View>
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
                products.map(product => (
                    <Pressable key={product.productId} className="border rounded-lg h-16 mx-2 flex-row justify-between items-center px-2 my-1" onPress={() => {
                        setSelectedProduct(product);

                        initializeConsumeAttr(product)

                        setImage(null)
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

                {!image && (<Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={startCamera}>
                    <AntDesign name="camerao" size={24} color="black" />
                    <Text className='text-2xl ml-4'>Foto hinzufügen</Text>
                </Pressable>)}

                <Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => consumeProduct()}>
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
        </View >
    )
}

export default storeId