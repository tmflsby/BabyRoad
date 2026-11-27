import { Test, TestingModule } from '@nestjs/testing';
import { FeedingRecordService } from './feeding-record.service';

describe('FeedingRecordService', () => {
  let service: FeedingRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedingRecordService],
    }).compile();

    service = module.get<FeedingRecordService>(FeedingRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
