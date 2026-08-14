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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { AuthenticatedUser } from 'src/common/interfaces';

import {
  CreateProjectDto,
  ProjectResponseDto,
  UpdateProjectDto,
} from './dto';

import { ProjectService } from './project.service';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('projects')
export class ProjectController {

  constructor(private readonly projectService: ProjectService) {}

  @ApiOperation({
    summary: 'Create project',
    description: 'Creates a new project inside a workspace',
  })
  @ApiCreatedResponse({
    type: ProjectResponseDto,
    description: 'Project successfully created',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiConflictResponse({
    description: 'Project with this key already exists in the workspace',
  })
  @ApiNotFoundResponse({
    description: 'Workspace not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to create a project in this workspace',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.projectService.create(dto, user);
  }

  @ApiOperation({
    summary: 'Get all projects',
    description: 'Returns projects accessible to the authenticated user',
  })
  @ApiOkResponse({
    type: ProjectResponseDto,
    isArray: true,
    description: 'List of projects',
  })
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.projectService.findAll(user);
  }

  @ApiOperation({
    summary: 'Get project by ID',
    description: 'Returns a project accessible to the authenticated user',
  })
  @ApiOkResponse({
    type: ProjectResponseDto,
    description: 'Project found',
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to access this project',
  })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.projectService.findOne(id, user);
  }

  @ApiOperation({
    summary: 'Update project',
    description: 'Updates project information',
  })
  @ApiOkResponse({
    type: ProjectResponseDto,
    description: 'Project successfully updated',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiConflictResponse({
    description: 'Project with this key already exists in the workspace',
  })
  @ApiNotFoundResponse({
    description: 'Project not found'
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to update this project'
  })
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.projectService.update(id, dto, user);
  }

  @ApiOperation({
    summary: 'Delete project',
    description: 'Deletes a project and its related data',
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to delete this project',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.projectService.remove(id, user);
  }
}
