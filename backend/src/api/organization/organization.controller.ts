import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/common/guards';
import {
  CurrentUser,
} from 'src/common/decorators';
import { AuthenticatedUser } from 'src/common/interfaces';
import {
  CreateOrganizationDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from './dto';
import { OrganizationService } from './organization.service';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @ApiOperation({
    summary: 'Create organization',
    description: 'Creates a new organization owned by the authenticated user',
  })
  @ApiCreatedResponse({
    type: OrganizationResponseDto,
    description: 'Organization successfully created',
  })
  @ApiConflictResponse({
    description: 'Organization with this slug already exists'
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.organizationService.create(dto, user);
  }

  @ApiOperation({
    summary: 'Get my organizations',
    description:
      'Returns organizations owned by the authenticated user',
  })
  @ApiOkResponse({
    type: OrganizationResponseDto,
    isArray: true,
  })
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.organizationService.findAll(user);
  }

  @ApiOperation({
    summary: 'Get organization by ID',
    description:
      'Returns an organization by its unique identifier',
  })
  @ApiOkResponse({
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationService.findOne(id, user);
  }

  @ApiOperation({
    summary: 'Update organization',
    description:
      'Updates an organization owned by the authenticated user',
  })
  @ApiOkResponse({
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  @ApiConflictResponse({
    description:
      'Organization with this slug already exists',
  })
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.organizationService.update(id, dto, user);
  }

  @ApiOperation({
    summary: 'Delete organization',
    description:
      'Deletes an organization owned by the authenticated user',
  })
  @ApiNoContentResponse({
    description: 'Organization successfully deleted',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.organizationService.remove(id, user);
  }
}
