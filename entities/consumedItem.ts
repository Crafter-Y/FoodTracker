import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm/browser";
import { Product } from "./product";
import { StoredImage } from "./storedImage";

@Entity('consumed_item')
export class ConsumedItem {
    @PrimaryGeneratedColumn()
    consumedId!: number;

    @CreateDateColumn()
    date: Date;

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

    @ManyToOne(() => Product)
    @JoinColumn()
    product!: Product;

    @ManyToOne(() => StoredImage, { nullable: true })
    @JoinColumn()
    image?: StoredImage;
}