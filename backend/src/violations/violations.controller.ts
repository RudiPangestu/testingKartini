import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ViolationsService } from './violations.service';
import {
  CreateViolationDto,
  CreateViolationTypeDto,
  UpdateViolationTypeDto,
} from './dto/violation.dto';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

// Seluruh fitur pelanggaran hanya untuk ADMIN.
@Roles(Role.ADMIN)
@Controller('violations')
export class ViolationsController {
  constructor(private readonly service: ViolationsService) {}

  // ----- Katalog jenis pelanggaran -----
  @Get('types')
  listTypes(@Query('includeInactive') includeInactive?: string) {
    return this.service.listTypes(includeInactive === 'true');
  }

  @Post('types')
  createType(@Body() dto: CreateViolationTypeDto) {
    return this.service.createType(dto);
  }

  @Patch('types/:id')
  updateType(@Param('id') id: string, @Body() dto: UpdateViolationTypeDto) {
    return this.service.updateType(id, dto);
  }

  @Delete('types/:id')
  removeType(@Param('id') id: string) {
    return this.service.removeType(id);
  }

  // ----- Catatan pelanggaran murid -----
  @Get()
  listByStudent(@Query('studentId') studentId: string) {
    return this.service.listByStudent(studentId);
  }

  @Post()
  record(@Body() dto: CreateViolationDto, @CurrentUser() user: JwtUser) {
    return this.service.record(dto, user);
  }

  @Delete(':id')
  removeRecord(@Param('id') id: string) {
    return this.service.removeRecord(id);
  }
}
