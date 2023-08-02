import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm/browser";
import { Product } from "./product";

@Entity('consumed_item')
export class ConsumedItem {
    @PrimaryGeneratedColumn()
    consumedId!: number;

    @CreateDateColumn()
    date: Date;

    @Column("int")
    kcal!: number;

    @ManyToOne(() => Product)
    @JoinColumn()
    product!: Product;
}