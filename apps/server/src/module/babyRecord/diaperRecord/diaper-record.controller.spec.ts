import { Test, TestingModule } from '@nestjs/testing';
import { DiaperRecordController } from './diaper-record.controller';

describe('DiaperRecordController', () => {
  let controller: DiaperRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiaperRecordController],
    }).compile();

    controller = module.get<DiaperRecordController>(DiaperRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
