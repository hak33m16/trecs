import { Entity, EntityManager } from "../src/index";

describe("Entity", () => {
  let entityManager: EntityManager;
  beforeEach(() => {
    entityManager = new EntityManager();
  });

  test("creation works", () => {
    const entity = entityManager.createEntity();
    expect(entity.id).toEqual(0);
  });
});
