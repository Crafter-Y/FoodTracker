import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm/browser";
import { Store } from "./store";
import { ConsumedItem } from "./consumedItem";

@Entity('product')
export class Product {
    @PrimaryGeneratedColumn()
    productId!: number;

    @Column("text")
    name!: string;

    // attributes
    @Column("int", { nullable: true })
    kcal?: number;

    @Column("float", { nullable: true })
    healthy?: number;

    @Column("int", { nullable: true })
    liquidMl?: number;

    @Column("float", { nullable: true })
    price?: number;

    @Column("float", { nullable: true })
    fat?: number;

    @Column("float", { nullable: true })
    sugar?: number;

    @Column("float", { nullable: true })
    protein?: number;

    @Column("float", { nullable: true })
    salt?: number;

    // end attributes

    @ManyToOne(() => Store)
    @JoinColumn()
    store!: Store;

    @OneToMany(() => ConsumedItem, (consumedItem) => consumedItem.product)
    consumedItems!: ConsumedItem[]
}