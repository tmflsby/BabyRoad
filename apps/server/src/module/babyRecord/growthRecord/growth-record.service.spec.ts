import { Test, TestingModule } from '@nestjs/testing';
import { GrowthRecordService } from './growth-record.service';

describe('GrowthRecordService', () => {
  let service: GrowthRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GrowthRecordService],
    }).compile();

    service = module.get<GrowthRecordService>(GrowthRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
