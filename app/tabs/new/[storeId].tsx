import { Pressable, Text, TextInput, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import Modal, { ModalHandle } from '@/components/Modal';
import useDatabase from '@/hooks/useDatabase';
import { Product } from '@/entities/product';
import { Store } from '@/entities/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { ConsumedItem } from '@/entities/consumedItem';

const storeId = () => {
    const { storeId } = useLocalSearchParams();
    const { dataSource, isReady } = useDatabase();

    const [products, setProducts] = useState<Product[]>([]);

    const [search, setSearch] = useState("")

    const createModal = useRef<ModalHandle>(null);
    const [newProductName, setNewProductName] = useState("")
    const [newProductKcal, setNewProductKcal] = useState("")

    const selectModal = useRef<ModalHandle>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product>();
    const [selectedProductKcal, setSelectedProductKcal] = useState("")

    const createProduct = async () => {
        if (!isReady) return;

        let storeRepo = dataSource.getRepository(Store);

        let stId = Number(storeId)
        let store = await storeRepo.findOne({ where: { storeId: stId } })
        if (store == null) return;

        let productRepo = dataSource.getRepository(Product);

        let product = new Product();
        product.store = store
        product.kcal = Number(newProductKcal)
        product.name = newProductName

        await productRepo.save(product)

        fetchProducts()

        createModal.current.toggleModal()
    }

    const consumeProduct = async () => {
        if (!isReady) return;

        let consumeRepo = dataSource.getRepository(ConsumedItem);

        let item = new ConsumedItem();

        item.product = selectedProduct
        item.kcal = Number(selectedProductKcal);

        consumeRepo.save(item);

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
            }
        })

        setProducts(allProducts)
    }

    useEffect(() => {
        if (!isReady) return;

        fetchProducts();
    }, [isReady])

    return (
        <View>
            <Pressable className="border m-2 mx-2 rounded-lg h-12 flex-row items-center px-2" onPress={() => createModal.current.toggleModal()}>
                <AntDesign name="pluscircle" size={24} color="black" />
                <Text className='text-2xl ml-4'>Produkt hinzufügen</Text>
            </Pressable>

            <Modal type='CENTER' ref={createModal}>
                <Text className='text-2xl font-semibold mt-1 text-center'>Produkt erstellen</Text>

                <Text className='px-2'>Name</Text>
                <TextInput className="border rounded-lg text-lg mx-2 px-2" placeholder='Name des Produkts' value={newProductName} onChangeText={setNewProductName} />

                <Text className='px-2 mt-4'>Kalorien</Text>
                <TextInput className="border rounded-lg text-lg mx-2 px-2" placeholder='Kalorien' value={newProductKcal} onChangeText={setNewProductKcal} inputMode='numeric' />

                <Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => createProduct()}>
                    <AntDesign name="pluscircle" size={16} color="black" />
                    <Text className='text-2xl ml-4'>Produkt erstellen</Text>
                </Pressable>
            </Modal>

            <View className="flex-row mx-2 mt-1">
                <TextInput className="border-b text-xl flex-grow" placeholder='Suche' returnKeyType='search' value={search} onChangeText={setSearch} />
                <AntDesign name="search1" size={24} color="black" />
            </View>

            {products.map(product => (
                <Pressable key={product.productId} className="border rounded-lg h-16 mx-2 flex-row justify-between items-center px-2 my-1" onPress={() => {
                    setSelectedProduct(product);
                    selectModal.current.toggleModal()
                    setSelectedProductKcal(product.kcal + "");
                }}>
                    <Ionicons name="images-sharp" size={24} color="black" />
                    <Text>{product.name}</Text>
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="black" />
                </Pressable>
            ))}

            <Modal type='CENTER' ref={selectModal}>
                <Text className='text-2xl font-semibold mt-1 text-center'>{selectedProduct?.name}</Text>

                <Text className='px-2 mt-4'>Kalorien</Text>
                <TextInput className="border rounded-lg text-lg mx-2 px-2" placeholder='Kalorien' value={selectedProductKcal} onChangeText={setSelectedProductKcal} inputMode='numeric' />

                <Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => { }}>
                    <AntDesign name="camerao" size={24} color="black" />
                    <Text className='text-2xl ml-4'>Foto hinzufügen</Text>
                </Pressable>

                <Pressable className="border my-4 mx-2 rounded-lg h-10 flex-row items-center px-2" onPress={() => consumeProduct()}>
                    <AntDesign name="pluscircle" size={16} color="black" />
                    <Text className='text-2xl ml-4'>Konsumieren</Text>
                </Pressable>
            </Modal>
        </View>
    )
}

export default storeId