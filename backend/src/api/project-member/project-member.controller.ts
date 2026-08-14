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
  CreateProjectMemberDto,
  ProjectMemberResponseDto,
  UpdateProjectMemberDto,
} from './dto';

import { ProjectMemberService } from './project-member.service';

@ApiTags('Project Members')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('projects/:projectId/members')
export class ProjectMemberController {

  constructor(private readonly projectMemberService: ProjectMemberService) {}

  @ApiOperation({
    summary: 'Get project members',
    description: 'Returns all members of a project',
  })
  @ApiOkResponse({
    type: ProjectMemberResponseDto,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to view project members',
  })
  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.projectMemberService.findAll(
      projectId, 
      currentUser
    );
  }

  @ApiOperation({
    summary: 'Leave project',
    description: 'Removes the current user from the project',
  })
  @ApiForbiddenResponse({
    description: 'Project owner cannot leave the project',
  })
  @ApiNotFoundResponse({
    description: 'Project or project membership not found',
  })
  @Post('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @Param('projectId') projectId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.projectMemberService.leave(
      projectId,
      currentUser
    );
  }

  @ApiOperation({
    summary: 'Get project members',
    description: 'Returns a specific project member',
  })
  @ApiOkResponse({
    type: ProjectMemberResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Project member not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to view project members',
  })
  @Get(':memberId')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.projectMemberService.findOne(
      projectId, 
      memberId, 
      currentUser
    );
  }
  
  @ApiOperation({
    summary: 'Add project member',
    description: 'Adds a user to the project with the MEMBER role',
  })
  @ApiCreatedResponse({
    type: ProjectMemberResponseDto,
    description: 'Project member successfully added',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiConflictResponse({
    description: 'User is already a member of this project',
  })
  @ApiForbiddenResponse({
    description: 'Only project owners or project administrators can add members',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectMemberDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.projectMemberService.create(
      projectId,
      dto, 
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Update project member role',
    description: 'Changes the role of a project member',
  })
  @ApiOkResponse({
    type: ProjectMemberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiNotFoundResponse({
    description: 'Project member not found',
  })
  @ApiForbiddenResponse({
    description: 'Only project owners and project administrators can change member roles',
  })
  @Patch(':memberId')
  async update(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string, 
    @Body() dto: UpdateProjectMemberDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.projectMemberService.update(
      projectId,
      memberId,
      dto,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Remove project member',
    description: 'Removes a member from the project',
  })
  @ApiNotFoundResponse({
    description: 'Project member not found',
  })
  @ApiForbiddenResponse({
    description: 'Only project owners and project administrators can remove members',
  })
  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.projectMemberService.remove(
      projectId,
      memberId,
      currentUser,
    );
  }
}
