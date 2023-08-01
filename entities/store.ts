import { Entity, Column, PrimaryGeneratedColumn } from "typeorm/browser";

@Entity('store')
export class Store {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("text")
    name!: string;
}