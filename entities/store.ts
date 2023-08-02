import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm/browser";
import { Product } from "./product";

@Entity('store')
export class Store {
    @PrimaryGeneratedColumn()
    storeId!: number;

    @Column("text")
    name!: string;

    @OneToMany(() => Product, (product) => product.store)
    products!: Product[]
}