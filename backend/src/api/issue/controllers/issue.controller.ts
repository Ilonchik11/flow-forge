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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { AuthenticatedUser } from 'src/common/interfaces';

import {
  CreateIssueDto,
  IssueResponseDto,
  UpdateIssueDto,
} from '../dto';

import { IssueService } from '../services/issue.service';

@ApiTags('Issues')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('issues')
export class IssueController {

  constructor(private readonly issueService: IssueService) {}

  @ApiOperation({
    summary: 'Create issue',
    description: 'Creates a new issue in a project',
  })
  @ApiCreatedResponse({
    type: IssueResponseDto,
    description: 'Issue successfully created',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiConflictResponse({
    description: 'Issue could not be created because of the conflict',
  })
  @ApiNotFoundResponse({
    description: 'Project or assignee not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to create issues',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateIssueDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.issueService.create(
      dto,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Get issues',
    description: 'Returns issues accessible to the authenticated user',
  })
  @ApiOkResponse({
    type: IssueResponseDto,
    isArray: true,
    description: 'List of issues',
  })
  @Get('project/:projectId')
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.issueService.findAll(
      projectId,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Get issue by ID',
    description: 'Returns a specific issue',
  })
  @ApiOkResponse({
    type: IssueResponseDto,
    description: 'Issue found',
  })
  @ApiNotFoundResponse({
    description: 'Issue not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not gave permission to view this issue',
  })
  @Get(':issueId')
  async findOne(
    @Param('issueId') issueId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.issueService.findOne(
      issueId, 
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Update issue',
    description: 'Updates an existing issue',
  })
  @ApiOkResponse({
    type: IssueResponseDto,
    description: 'Issue successfully updated',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiNotFoundResponse({
    description: 'Issue or assignee not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to update this issue',
  })
  @Patch(':issueId')
  async update(
    @Param('issueId') issueId: string, 
    @Body() dto: UpdateIssueDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.issueService.update(
      issueId, 
      dto, 
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Delete issue',
    description: 'Deletes an issue',
  })
  @ApiNoContentResponse({
    description: 'Issue successfully deleted',
  })
  @ApiNotFoundResponse({
    description: 'Issue not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to delete this issue',
  })
  @Delete(':issueId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('issueId') issueId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.issueService.remove(
      issueId, 
      currentUser,
    );
  }
}
