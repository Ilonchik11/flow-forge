import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceMemberController } from './workspace-member.controller';
import { WorkspaceMemberService } from './workspace-member.service';

describe('WorkspaceMemberController', () => {
  let controller: WorkspaceMemberController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceMemberController],
      providers: [WorkspaceMemberService],
    }).compile();

    controller = module.get<WorkspaceMemberController>(WorkspaceMemberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
