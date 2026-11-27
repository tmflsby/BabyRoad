import { Test, TestingModule } from '@nestjs/testing';
import { FeedingRecordController } from './feeding-record.controller';

describe('FeedingRecordController', () => {
  let controller: FeedingRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedingRecordController],
    }).compile();

    controller = module.get<FeedingRecordController>(FeedingRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
