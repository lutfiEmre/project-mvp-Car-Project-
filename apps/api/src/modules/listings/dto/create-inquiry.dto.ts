import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1 (555) 123-4567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'I am interested in this vehicle. Please contact me.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: 'listing-id-here' })
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @ApiProperty({ example: 'dealer-id-here', required: false })
  @IsOptional()
  @IsString()
  dealerId?: string;
}


