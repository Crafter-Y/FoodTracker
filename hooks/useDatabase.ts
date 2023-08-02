import { useEffect, useContext, useState } from "react";
import { DataSource } from "typeorm/browser";
import { AppContext, AppContextType } from "@/helpers/AppContext";
import { Store } from "@/entities/store";
import { Product } from "@/entities/product";
import { ConsumedItem } from "@/entities/consumedItem";

export default function useDatabase() {
    const { dataSource, setDataSource } = useContext(AppContext) as AppContextType;
    const [isReady, setIsReady] = useState(false);

    const checkStore = async (ds: DataSource, name: string) => {
        let storeRepo = ds.getRepository(Store)
        let entry = await storeRepo.findOne({
            where: {
                name: name
            }
        })
        if (entry == null) {
            let store = new Store()
            store.name = name
            await storeRepo.save(store);
        }
    }

    const insertDefaultValues = async (ds: DataSource) => {
        await checkStore(ds, "Zuhause");
        await checkStore(ds, "Anderer");
        await checkStore(ds, "Netto");
    }

    const setupDatabase = async () => {
        let ds: DataSource;
        if (dataSource != null) {
            ds = dataSource
        } else {
            ds = new DataSource({
                database: "test6",
                driver: require('expo-sqlite'),
                synchronize: true,
                entities: [Store, Product, ConsumedItem],
                type: "expo",
            })
        }

        if (!ds.isInitialized) {
            ds = await ds.initialize();

            await insertDefaultValues(ds);
        }

        setDataSource(ds);
        setIsReady(true)
    }

    useEffect(() => {
        setIsReady(false);
        setupDatabase()
    })

    return { dataSource, isReady }
}