import { Test, TestingModule } from '@nestjs/testing';
import { DiaperRecordService } from './diaper-record.service';

describe('DiaperRecordService', () => {
  let service: DiaperRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiaperRecordService],
    }).compile();

    service = module.get<DiaperRecordService>(DiaperRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
