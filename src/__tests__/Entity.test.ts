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

  test("entity ids auto increment", () => {
    const entity = entityManager.createEntity();

    const secondEntity = entityManager.createEntity();
    expect(secondEntity.id).toEqual(entity.id + 1);
  });

  test("can add component to entity, retrieve it, and modifications persist", () => {
    const entity = entityManager.createEntity();

    entity.addComponents(FirstDummyComponent);
    entity.component(FirstDummyComponent).dummyField = "dummyval1";
    expect(entity.component(FirstDummyComponent).dummyField).toEqual(
      "dummyval1"
    );

    expect(entity.hasComponent(FirstDummyComponent)).toEqual(true);
    expect(entity.hasAllComponents(FirstDummyComponent)).toEqual(true);

    const firstComponentByRef = entity.component(FirstDummyComponent);
    firstComponentByRef.dummyField = "dummyvalnumber2";
    expect(entity.component(FirstDummyComponent).dummyField).toEqual(
      "dummyvalnumber2"
    );
  });

  test("can add tag to entity, and retreive it by that tag", () => {
    const entity = entityManager.createEntity();
    expect(entity.hasTag("testtag")).toEqual(false);

    entity.addTag("testtag");
    expect(entity.hasTag("testtag")).toEqual(true);
    expect(entityManager.queryTag("testtag")?.getById(entity.id)).toEqual(
      entity
    );

    entity.removeTag("testtag");
    expect(entity.hasTag("testtag")).toEqual(false);
  });

  test("can remove component", () => {
    const entity = entityManager.createEntity();

    entity.addComponents(FirstDummyComponent);
    expect(entity.getComponent(FirstDummyComponent)).not.toBeUndefined();

    entity.removeComponent(FirstDummyComponent);
    expect(entity.getComponent(FirstDummyComponent)).toBeUndefined();

    entity.addComponents(FirstDummyComponent);
    expect(entity.getComponent(FirstDummyComponent)).not.toBeUndefined();

    entity.removeAllComponents();
    expect(entity.getComponent(FirstDummyComponent)).toBeUndefined();
  });

  test("removing entity clears existing tags, components, and manager", () => {
    const entity = entityManager.createEntity();
    expect(entity._manager).toBeDefined();

    expect(entity.getComponent(FirstDummyComponent)).toBeUndefined();
    entity.addComponents(FirstDummyComponent);
    expect(entity.getComponent(FirstDummyComponent)).not.toBeUndefined();

    expect(entity.hasTag("testtag")).toEqual(false);
    entity.addTag("testtag");
    expect(entity.hasTag("testtag")).toEqual(true);

    entity.remove();
    expect(entity._manager).toEqual(null);
    // TODO: Should all entity functions throw if it has no manager?
    expect(entity.hasTag("testtag")).toEqual(false);
    expect(entity.getComponent(FirstDummyComponent)).toBeUndefined();
  });

  test("entity throws error when it has no manager", () => {
    const entity = entityManager.createEntity();
    expect(entity._manager).toBeDefined();
    entity.remove();

    expect(entity._manager).toBeNull();
    expect(() => entity.addTag("")).toThrow(
      "Can't perform actions on Entity with no EntityManager"
    );
  });

  test("can add multiple components to entity", () => {
    const entity = entityManager.createEntity();

    expect(entity.getComponent(FirstDummyComponent)).toBeUndefined();
    expect(entity.getComponent(SecondDummyComponent)).toBeUndefined();

    entity.addComponents(FirstDummyComponent);
    entity.addComponents(SecondDummyComponent);

    expect(entity.getComponent(FirstDummyComponent)).not.toBeUndefined();
    expect(entity.getComponent(SecondDummyComponent)).not.toBeUndefined();
  });

  test("removing tag that doesnt exist shouldnt throw", () => {
    entityManager.createEntity().removeTag("nonexistent");
  });

  test("removing a tag this entity doesnt have shouldnt throw", () => {
    entityManager.createEntity().addTag("testtag");
    entityManager.createEntity().removeTag("testtag");
  });

  test("removing a component that an entity doesnt have shouldnt throw", () => {
    entityManager.createEntity().removeComponent(FirstDummyComponent);
  });

  test("can add multiple components at once that are auto constructed", () => {
    const entity = entityManager
      .createEntity()
      .addComponents(FirstDummyComponent, SecondDummyComponent);

    expect(entity.component(FirstDummyComponent)).not.toBeUndefined();
    expect(entity.component(SecondDummyComponent)).not.toBeUndefined();

    entity.component(FirstDummyComponent).dummyField = "test";
    entity.component(SecondDummyComponent).secondDummyField = 69;

    expect(entity.component(FirstDummyComponent).dummyField).toEqual("test");
    expect(entity.component(SecondDummyComponent).secondDummyField).toEqual(69);
  });

  test("addComponent returns reference to underlying component", () => {
    const entity = entityManager.createEntity();
    const dummyRef = entity.addComponent(FirstDummyComponent);
    expect(entity.component(FirstDummyComponent)).toBe(dummyRef);

    dummyRef.dummyField = "test";
    expect(entity.component(FirstDummyComponent).dummyField).toBe("test");
  });

  test("component() auto constructs missing components", () => {
    const entity = entityManager.createEntity();
    expect(entity.getComponent(FirstDummyComponent)).toBeUndefined();
    entity.component(FirstDummyComponent).dummyField = "test";
    expect(entity.getComponent(FirstDummyComponent)).not.toBeUndefined();
    expect(entity.component(FirstDummyComponent).dummyField).toEqual("test");
  });
});
