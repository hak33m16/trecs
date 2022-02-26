import { EntityManager } from "..";
import {
  FirstDummyComponent,
  SecondDummyComponent,
} from "../tests/DummyComponents";

describe("Entity", () => {
  let entityManager: EntityManager;
  beforeEach(() => {
    entityManager = new EntityManager();
  });

  test("entity ids start at 0", () => {
    const entity = entityManager.createEntity();
    expect(entity.id).toEqual(0);
  });

  test("can add component to entity, retrieve it, and modifications persist", () => {
    const entity = entityManager.createEntity();

    const firstComponent = new FirstDummyComponent();
    firstComponent.dummyField = "dummyval1";
    entity.addComponent(firstComponent);
    expect(entity.component(FirstDummyComponent)!.dummyField).toEqual(
      "dummyval1"
    );

    expect(entity.hasComponent(FirstDummyComponent)).toEqual(true);
    expect(entity.hasAllComponents(FirstDummyComponent)).toEqual(true);

    const firstComponentByRef = entity.component(FirstDummyComponent);
    firstComponentByRef!.dummyField = "dummyvalnumber2";
    expect(entity.component(FirstDummyComponent)!.dummyField).toEqual(
      "dummyvalnumber2"
    );
  });

  test("can add tag to entity, and retreive it by that tag", () => {
    const entity = entityManager.createEntity();
    entity.addTag("testtag");

    expect(entityManager.queryTag("testtag").get(entity.id)).toEqual(entity);
  });
});
