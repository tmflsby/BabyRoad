import { Test, TestingModule } from '@nestjs/testing';
import { SleepRecordService } from './sleep-record.service';

describe('SleepRecordService', () => {
  let service: SleepRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SleepRecordService],
    }).compile();

    service = module.get<SleepRecordService>(SleepRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
