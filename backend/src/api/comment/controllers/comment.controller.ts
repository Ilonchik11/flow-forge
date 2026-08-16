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
  UseGuards
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
  CommentResponseDto,
  CreateCommentDto,
  UpdateCommentDto,
} from '../dto';

import { CommentService } from '../services/comment.service';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('comments')
export class CommentController {

  constructor(
    private readonly commentService: CommentService,
  ) {}

  @ApiOperation ({
    summary: 'Create comment',
    description: 'Creates a new comment for an issue',
  })
  @ApiCreatedResponse({
    type: CommentResponseDto,
    description: 'Comment successfully created',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiNotFoundResponse({
    description: 'Issue not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to create a comment',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.commentService.create(
      dto,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Get issue comments',
    description: 'Returns all comments belonging to an issue',
  })
  @ApiOkResponse({
    type: CommentResponseDto,
    isArray: true,
    description: 'Comments to an issue successfully found'
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data: issue ID is required or invalid',
  })
  @ApiNotFoundResponse({
    description: 'Issue not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to view comments for this issue',
  })
  @Get('issue/:issueId')
  async findAll(
    @Param('issueId') issueId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.commentService.findAll(
      issueId,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Get comment by ID',
    description: 'Returns a specific comment',
  })
  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Comment successfully found',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to view this comment',
  })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.commentService.findOne(
      id,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Update comment',
    description: 'Updates the content of an existing comment',
  })
  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Comment successfully updated',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
  })
  @ApiForbiddenResponse({
    description: 'Only the comment author can update the comment',
  })
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateCommentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.commentService.update(
      id, 
      dto,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Delete comment',
    description: 'Deletes an existing comment',
  })
  @ApiNoContentResponse({
    description: 'Comment successfully deleted',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
  })
  @ApiForbiddenResponse({
    description: 'Only the comment author, project administrators, project owners, or system administrators can delete the comment'
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.commentService.remove(
      id,
      currentUser,
    );
  }
}
