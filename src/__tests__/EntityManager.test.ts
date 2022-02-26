import { EntityManager } from "..";
import {
  FirstDummyComponent,
  SecondDummyComponent,
} from "../tests/DummyComponents";

describe("EntityManager", () => {
  let entityManager: EntityManager;
  beforeEach(() => {
    entityManager = new EntityManager();
  });

  test("can remove all entities of a specific tag", () => {
    const entity = entityManager.createEntity();
    entity.addTag("testtag");

    const secondEntity = entityManager.createEntity();
    secondEntity.addTag("testtag");

    const thirdEntity = entityManager.createEntity();

    expect(entity._manager).toBeTruthy();
    expect(secondEntity._manager).toBeTruthy();
    expect(thirdEntity._manager).toBeTruthy();

    entityManager.removeEntitiesByTag("testtag");

    expect(entity._manager).toBeNull();
    expect(secondEntity._manager).toBeNull();
    expect(thirdEntity._manager).toBeTruthy();
  });

  test("can remove all entities", () => {
    const entity = entityManager.createEntity();
    const secondEntity = entityManager.createEntity();

    expect(entity._manager).toBeTruthy();
    expect(secondEntity._manager).toBeTruthy();

    entityManager.removeAllEntities();

    expect(entity._manager).toBeNull();
    expect(entity._manager).toBeNull();
  });

  test("throws error when removing if entity is untracked", () => {
    const entity = entityManager.createEntity();
    entity.remove();

    expect(() => entityManager.removeEntity(entity)).toThrow(
      "Tried to remove entity not in list"
    );
  });

  test("throws error when adding component type twice", () => {
    const entity = entityManager.createEntity();

    const firstComponent1 = new FirstDummyComponent();
    const firstComponent2 = new FirstDummyComponent();

    entity.addComponent(firstComponent1);
    expect(() => entity.addComponent(firstComponent2)).toThrow();
  });

  test("allows querying by component", () => {
    const entity = entityManager.createEntity();
    const secondEntity = entityManager.createEntity();

    const firstComponent = new FirstDummyComponent();
    const secondComponent = new SecondDummyComponent();

    entity.addComponent(firstComponent);
    entity.addComponent(secondComponent);

    const firstComponent2 = new FirstDummyComponent();

    secondEntity.addComponent(firstComponent2);

    const firstQuery = entityManager.queryComponents(
      FirstDummyComponent,
      SecondDummyComponent
    );
    expect(firstQuery.get(entity.id)).toEqual(entity);
    expect(firstQuery.get(secondEntity.id)).toBeUndefined();

    const secondQuery = entityManager.queryComponents(FirstDummyComponent);
    expect(secondQuery.get(entity.id)).toEqual(entity);
    expect(secondQuery.get(secondEntity.id)).toEqual(secondEntity);

    const thirdQuery = entityManager.queryComponents(SecondDummyComponent);
    expect(thirdQuery.get(entity.id)).toEqual(entity);
    expect(thirdQuery.get(secondEntity.id)).toBeUndefined();
  });

  test("clears entities out of component groups when a component is removed", () => {
    const entity = entityManager.createEntity();

    const firstComponent = new FirstDummyComponent();
    entity.addComponent(firstComponent);

    expect(entityManager["groups"].size).toEqual(0);
    expect(
      entityManager.queryComponents(FirstDummyComponent).get(entity.id)
    ).toEqual(entity);
    expect(entityManager["groups"].size).toEqual(1);

    entity.removeComponent(FirstDummyComponent);
    expect(entityManager.queryComponents(FirstDummyComponent).size).toEqual(0);
  });

  test("adds components to existing groups", () => {
    const entity = entityManager.createEntity();

    entity.addComponent(new FirstDummyComponent());

    expect(entityManager["groups"].size).toBe(0);
    // Create group
    const query = entityManager.queryComponents(FirstDummyComponent);
    expect(query.size).toBe(1);
    expect(query.get(entity.id)).toBe(entity);
    expect(entityManager["groups"].size).toBe(1);

    const secondEntity = entityManager.createEntity();
    // Should reuse group
    secondEntity.addComponent(new FirstDummyComponent());
    expect(entityManager["groups"].size).toBe(1);
    // TODO: Should this be expected behavior? Does it make
    // more sense to create a new array on each query because
    // of this behavior? Query results being affected by
    // future modifications could be confusing
    expect(query.get(secondEntity.id)).toBe(secondEntity);
  });

  test("retagging entity should do nothing", () => {
    const entity = entityManager.createEntity();

    expect(entityManager.queryTag("testtag")).toBeUndefined();
    entity.addTag("testtag");
    expect(entityManager.queryTag("testtag").get(entity.id)).toBe(entity);
    // Should do nothing
    entity.addTag("testtag");
    expect(entityManager.queryTag("testtag").get(entity.id)).toBe(entity);
  });

  test("removing entities by tag that doesnt exist should be fine", () => {
    entityManager.removeEntitiesByTag("nonexistent");
  });

  test("querying by a component group that doesnt exist should return empty map", () => {
    // TODO: Should probably change this behavior
    expect(entityManager.queryComponents(FirstDummyComponent).size).toBe(0);
  });

  test("returns correct entity count", () => {
    expect(entityManager.count()).toBe(0);
    const entity = entityManager.createEntity();
    expect(entityManager.count()).toBe(1);
    entity.remove();
    expect(entityManager.count()).toBe(0);
  });

  test("impossible normally: make sure indexGroup double calls dont overwrite groups", () => {
    const entity = entityManager.createEntity();

    entity.addComponent(new FirstDummyComponent());

    expect(entityManager["groups"].size).toBe(0);
    // Create group
    const groupMap = entityManager.queryComponents(FirstDummyComponent);
    entityManager["indexGroup"]([FirstDummyComponent]);
    // Didn't overwrite existing map reference
    expect(entityManager.queryComponents(FirstDummyComponent)).toBe(groupMap);
  });
});
