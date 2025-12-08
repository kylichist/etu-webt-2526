import { IsString, IsNumber, Min } from 'class-validator';

export class BuySellDto {
    @IsString()
    brokerName: string;

    @IsString()
    symbol: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}
