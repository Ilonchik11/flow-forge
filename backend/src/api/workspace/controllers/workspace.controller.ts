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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { AuthenticatedUser } from 'src/common/interfaces';
import { CreateWorkspaceDto, UpdateWorkspaceDto, WorkspaceResponseDto } from '../dto';
import { WorkspaceService } from '../services/workspace.service';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('workspaces')
export class WorkspaceController {

  constructor(private readonly workspaceService: WorkspaceService) {}

  @ApiOperation({
    summary: 'Create workspace',
    description: 'Creates a new workspace inside an organization',
  })
  @ApiCreatedResponse({
    type: WorkspaceResponseDto,
    description: 'Workspace successfully created',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiConflictResponse({
    description: 'Workspace with this slug already exists in the organization',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.workspaceService.create(dto, user);
  }

  @ApiOperation({
    summary: 'Get all workspaces',
    description:
      'Returns workspaces owned by the authenticated user',
  })
  @ApiOkResponse({
    description: 'List of workspaces',
  })
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.workspaceService.findAll(user);
  }

  @ApiOperation({
    summary: 'Get workspace by ID',
    description:
      'Returns a workspace accessible to the authenticated user',
  })
  @ApiOkResponse({
    description: 'Workspace found',
  })
  @ApiNotFoundResponse({
    description: 'Workspace not found',
  })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.workspaceService.findOne(id, user);
  }

  @ApiOperation({
    summary: 'Update workspace',
    description:
      'Updates workspace information',
  })
  @ApiOkResponse({
    description: 'Workspace successfully updated',
  })
  @ApiNotFoundResponse({
    description: 'Workspace not found',
  })
  @ApiConflictResponse({
    description: 'Workspace with this slug already exists in the organization',
  })
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.workspaceService.update(id, dto, user);
  }

  @ApiOperation({
    summary: 'Delete workspace',
    description: 'Deletes a workspace and its related data',
  })
  @ApiNoContentResponse({
    description: 'Workspace successfully deleted',
  })
  @ApiNotFoundResponse({
    description: 'Workspace not found',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.workspaceService.remove(id, user);
  }
}
