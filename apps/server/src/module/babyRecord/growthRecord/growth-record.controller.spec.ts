import { Test, TestingModule } from '@nestjs/testing';
import { GrowthRecordController } from './growth-record.controller';

describe('GrowthRecordController', () => {
  let controller: GrowthRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrowthRecordController],
    }).compile();

    controller = module.get<GrowthRecordController>(GrowthRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
