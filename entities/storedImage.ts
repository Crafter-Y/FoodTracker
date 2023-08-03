import { Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm/browser";
import { ConsumedItem } from "./consumedItem";

@Entity('stored_image')
export class StoredImage {
    @PrimaryGeneratedColumn()
    imageId!: number;

    @OneToMany(() => ConsumedItem, (item) => item.image)
    items?: ConsumedItem[]
}