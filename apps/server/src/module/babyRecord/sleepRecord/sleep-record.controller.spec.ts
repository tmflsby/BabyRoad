import { Test, TestingModule } from '@nestjs/testing';
import { SleepRecordController } from './sleep-record.controller';

describe('SleepRecordController', () => {
  let controller: SleepRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SleepRecordController],
    }).compile();

    controller = module.get<SleepRecordController>(SleepRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
