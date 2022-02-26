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
    expect(entity.hasTag("testtag")).toEqual(false);

    entity.addTag("testtag");
    expect(entity.hasTag("testtag")).toEqual(true);
    expect(entityManager.queryTag("testtag").get(entity.id)).toEqual(entity);

    entity.removeTag("testtag");
    expect(entity.hasTag("testtag")).toEqual(false);
  });

  test("can remove component", () => {
    const entity = entityManager.createEntity();
    // TODO: Figure out why tf it's allowing this
    //entity.addComponent(FirstDummyComponent);
    const firstComponent = new FirstDummyComponent();
    entity.addComponent(firstComponent);
    expect(entity.component(FirstDummyComponent)).toEqual(firstComponent);

    entity.removeComponent(FirstDummyComponent);
    expect(entity.component(FirstDummyComponent)).toEqual(undefined);

    entity.addComponent(firstComponent);
    expect(entity.component(FirstDummyComponent)).toEqual(firstComponent);

    entity.removeAllComponents();
    expect(entity.component(FirstDummyComponent)).toEqual(undefined);
  });

  test("removing entity clears existing tags, components, and manager", () => {
    const entity = entityManager.createEntity();
    expect(entity._manager).toBeDefined();

    const firstComponent = new FirstDummyComponent();
    expect(entity.component(FirstDummyComponent)).toEqual(undefined);
    entity.addComponent(firstComponent);
    expect(entity.component(FirstDummyComponent)).toEqual(firstComponent);

    expect(entity.hasTag("testtag")).toEqual(false);
    entity.addTag("testtag");
    expect(entity.hasTag("testtag")).toEqual(true);

    entity.remove();
    expect(entity._manager).toEqual(null);
    // TODO: Should all entity functions throw if it has no manager?
    expect(entity.hasTag("testtag")).toEqual(false);
    expect(entity.component(FirstDummyComponent)).toEqual(undefined);
  });

  test("entity throws error when it has no manager", () => {
    const entity = entityManager.createEntity();
    expect(entity._manager).toBeDefined();
    entity.remove();

    expect(entity._manager).toEqual(null);
    expect(() => entity.addTag("")).toThrow(
      "Can't perform actions on Entity with no EntityManager"
    );
  });
});
