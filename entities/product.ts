import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm/browser";
import { Store } from "./store";
import { ConsumedItem } from "./consumedItem";

@Entity('product')
export class Product {
    @PrimaryGeneratedColumn()
    productId!: number;

    @Column("text")
    name!: string;

    @Column("int")
    kcal!: number;

    @ManyToOne(() => Store)
    @JoinColumn()
    store!: Store;

    @OneToMany(() => ConsumedItem, (consumedItem) => consumedItem.product)
    consumedItems!: ConsumedItem[]
}