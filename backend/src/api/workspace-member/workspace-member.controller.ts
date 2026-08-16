import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Body,
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

import { JwtGuard } from 'src/common/guards';
import { AuthenticatedUser } from 'src/common/interfaces';
import { CurrentUser } from 'src/common/decorators';

import {
  CreateWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
  WorkspaceMemberResponseDto,
} from './dto';

import { WorkspaceMemberService } from './workspace-member.service';

@ApiTags('Workspace Members')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('workspaces/:workspaceId/members')
export class WorkspaceMemberController {

  constructor(private readonly workspaceMemberService: WorkspaceMemberService) {}

  @ApiOperation({
    summary: 'Get workspace members',
    description: 'Returns all members of a workspace',
  })
  @ApiOkResponse({
    type: WorkspaceMemberResponseDto,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'User is not a member of the workspace or does not have permission',
  })
  @ApiNotFoundResponse({
    description: 'Workspace not found',
  })
  @Get()
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.workspaceMemberService.findAll(
      workspaceId, 
      currentUser
    );
  }

  @ApiOperation({
    summary: 'Get workspace member',
    description: 'Returns a specific member of a workspace',
  })
  @ApiOkResponse({
    type: WorkspaceMemberResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Workspace member not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission',
  })
  @Get(':memberId')
  async findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.workspaceMemberService.findOne(
      workspaceId, 
      memberId, 
      currentUser
    );
  }

  @ApiOperation({
    summary: 'Add workspace member',
    description: 'Adds a user to the workspace with the MEMBER role',
  })
  @ApiCreatedResponse({
    type: WorkspaceMemberResponseDto,
    description: 'Workspace member successfully added',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiConflictResponse({
    description: 'User is already a member of this workspace',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiForbiddenResponse({
    description: 'Only workspace owners and administrators can add members',
  })
  @Post()
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkspaceMemberDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.workspaceMemberService.create(
      workspaceId,
      dto,
      currentUser,
    );
  }

    @ApiOperation({
      summary: 'Leave workspace',
      description: 'Removes the current user from the workspace',
    })
    @ApiNoContentResponse({
      description: 'User successfully left the workspace',
    })
    @ApiForbiddenResponse({
      description: 'Workspace owner cannot leave the workspace',
    })
    @Post('leave')
    @HttpCode(HttpStatus.NO_CONTENT)
    async leave(
      @Param('workspaceId') workspaceId: string,
      @CurrentUser() currentUser: AuthenticatedUser,
    ) {
      await this.workspaceMemberService.leave(
        workspaceId,
        currentUser,
      );
    }

  @ApiOperation({
    summary: 'Update workspace member role',
  })
  @ApiOkResponse({
    type: WorkspaceMemberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiForbiddenResponse({
    description: 'Only workspace owners and administrators can change member roles',
  })
  @ApiNotFoundResponse({
    description: 'Workspace member not found',
  })
  @Patch(':memberId')
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.workspaceMemberService.update(
      workspaceId,
      memberId,
      dto,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Remove workspace member',
    description: 'Removes a member from the workspace',
  })
  @ApiNoContentResponse({
    description: 'Workspace member successfully deleted',
  })
  @ApiForbiddenResponse({
    description: 'Only workspace owners and administrators can remove members',
  })
  @ApiNotFoundResponse({
    description: 'Workspace member not found',
  })
  @Delete(':memberId') 
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    await this.workspaceMemberService.remove(
      workspaceId,
      memberId,
      currentUser,
    );
  }
}