import { Test, TestingModule } from '@nestjs/testing';
import { TauxTvaController } from './taux-tva.controller';

describe('TauxTvaController', () => {
  let controller: TauxTvaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TauxTvaController],
    }).compile();

    controller = module.get<TauxTvaController>(TauxTvaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
